from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_student, require_admin
from database import get_db
from models import Skill, Student, StudentSkill
from schemas import SkillCreate, SkillResponse, StudentSkillCreate, StudentSkillResponse

router = APIRouter(tags=["Skills"])


def serialize_assignment(assignment: StudentSkill) -> dict:
    return {"id": assignment.id, "skill_id": assignment.skill_id, "name": assignment.skill.name, "category": assignment.skill.category, "can_teach": assignment.can_teach, "wants_to_learn": assignment.wants_to_learn}


@router.get("/skills", response_model=list[SkillResponse])
def list_skills(db: Session = Depends(get_db)):
    rows = db.query(Skill, func.coalesce(func.sum(StudentSkill.can_teach), 0), func.coalesce(func.sum(StudentSkill.wants_to_learn), 0)).outerjoin(StudentSkill, StudentSkill.skill_id == Skill.id).group_by(Skill.id).order_by(Skill.category, Skill.name).all()
    return [{**skill.__dict__, "can_teach_count": int(can_teach_count), "wants_to_learn_count": int(wants_to_learn_count)} for skill, can_teach_count, wants_to_learn_count in rows]


@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def create_skill(payload: SkillCreate, _: Student = Depends(require_admin), db: Session = Depends(get_db)):
    skill = Skill(**payload.model_dump())
    db.add(skill)
    try:
        db.commit()
        db.refresh(skill)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Skill already exists")
    return skill


@router.get("/students/{student_id}/skills", response_model=list[StudentSkillResponse])
def get_student_skills(student_id: int, _: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if db.get(Student, student_id) is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return [serialize_assignment(item) for item in db.query(StudentSkill).filter(StudentSkill.student_id == student_id).all()]


@router.post("/students/{student_id}/skills", response_model=StudentSkillResponse, status_code=status.HTTP_201_CREATED)
def add_student_skill(student_id: int, payload: StudentSkillCreate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own skills")
    if db.get(Student, student_id) is None or db.get(Skill, payload.skill_id) is None:
        raise HTTPException(status_code=404, detail="Student or skill not found")
    if not payload.can_teach and not payload.wants_to_learn:
        raise HTTPException(status_code=422, detail="Choose at least one skill direction")
    assignment = db.query(StudentSkill).filter_by(student_id=student_id, skill_id=payload.skill_id).first()
    if assignment is None:
        assignment = StudentSkill(student_id=student_id, **payload.model_dump())
        db.add(assignment)
    else:
        assignment.can_teach = payload.can_teach
        assignment.wants_to_learn = payload.wants_to_learn
    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Skill assignment already exists")
    return serialize_assignment(assignment)


@router.delete("/students/{student_id}/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_skill(student_id: int, skill_id: int, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only edit your own skills")
    assignment = db.query(StudentSkill).filter_by(student_id=student_id, skill_id=skill_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Skill assignment not found")
    db.delete(assignment)
    db.commit()
