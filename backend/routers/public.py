from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Course, Enrollment, LearningRequest, Review, Skill, Student, StudentSkill
from schemas import PublicStats

router = APIRouter(prefix="/public", tags=["Public"])


@router.get("/stats", response_model=PublicStats)
def public_stats(db: Session = Depends(get_db)):
    return {
        "total_students": db.query(func.count(Student.id)).scalar() or 0,
        "total_skills": db.query(func.count(Skill.id)).scalar() or 0,
        "total_courses": db.query(func.count(Course.id)).scalar() or 0,
        "total_completed_exchanges": db.query(func.count(LearningRequest.id)).filter(LearningRequest.status == "completed").scalar() or 0,
        "featured_skills": [{**skill.__dict__, "can_teach_count": int(can_teach or 0), "wants_to_learn_count": int(wants_to_learn or 0)} for skill, can_teach, wants_to_learn in db.query(Skill, func.sum(StudentSkill.can_teach), func.sum(StudentSkill.wants_to_learn)).outerjoin(StudentSkill, StudentSkill.skill_id == Skill.id).group_by(Skill.id).order_by(Skill.created_at.desc()).limit(6).all()],
        "featured_courses": [
            {**course.__dict__, "enrollment_count": count}
            for course, count in db.query(Course, func.count(Enrollment.id))
            .outerjoin(Enrollment, Enrollment.course_id == Course.id)
            .group_by(Course.id)
            .order_by(func.count(Enrollment.id).desc(), Course.created_at.desc())
            .limit(3)
            .all()
        ],
    }
