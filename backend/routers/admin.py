from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import require_admin
from database import get_db
from models import Course, LearningRequest, Review, Skill, Student

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/overview")
def overview(_: Student = Depends(require_admin), db: Session = Depends(get_db)):
    return {"total_students": db.query(func.count(Student.id)).scalar(), "total_skills": db.query(func.count(Skill.id)).scalar(), "active_requests": db.query(func.count(LearningRequest.id)).filter(LearningRequest.status.in_(["pending", "accepted"])).scalar(), "courses": db.query(func.count(Course.id)).scalar(), "reviews": db.query(func.count(Review.id)).scalar()}


@router.get("/requests")
def admin_requests(_: Student = Depends(require_admin), db: Session = Depends(get_db)):
    return [{"id": item.id, "requester": item.requester.full_name, "recipient": item.recipient.full_name, "skill": item.skill.name, "status": item.status, "created_at": item.created_at} for item in db.query(LearningRequest).order_by(LearningRequest.created_at.desc()).all()]
