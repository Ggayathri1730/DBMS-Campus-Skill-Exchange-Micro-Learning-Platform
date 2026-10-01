from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_student, require_admin
from database import get_db
from models import Enrollment, LearningSession, Review, Student, StudentSkill
from schemas import ProfileUpdate, StudentResponse, StudentSummary

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me/summary", response_model=StudentSummary)
def get_summary(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    skills = [serialize_skill(item) for item in current.skills]
    completed = db.query(func.count(Enrollment.id)).filter(Enrollment.student_id == current.id, Enrollment.progress == 100).scalar() or 0
    minutes = db.query(func.coalesce(func.sum(LearningSession.duration_minutes), 0)).filter(LearningSession.student_id == current.id, LearningSession.status == "completed").scalar() or 0
    rating = db.query(func.coalesce(func.avg(Review.rating), 0)).filter(Review.partner_id == current.id).scalar() or 0
    review_count = db.query(func.count(Review.id)).filter(Review.partner_id == current.id).scalar() or 0
    return {**current.__dict__, "skills_teaching": [item for item in skills if item["can_teach"]], "skills_learning": [item for item in skills if item["wants_to_learn"]], "learning_hours": round(float(minutes) / 60, 2), "courses_completed": completed, "average_rating": round(float(rating), 2), "review_count": review_count}


def serialize_skill(item: StudentSkill) -> dict:
    return {"id": item.id, "skill_id": item.skill_id, "name": item.skill.name, "category": item.skill.category, "can_teach": item.can_teach, "wants_to_learn": item.wants_to_learn}


@router.get("", response_model=list[StudentResponse])
def list_students(_: Student = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Student).order_by(Student.full_name).all()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only view your own private profile")
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.api_route("/{student_id}", methods=["PUT", "PATCH"], response_model=StudentResponse)
def update_student(student_id: int, payload: ProfileUpdate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own profile")
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, key, value)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered")
    return student
