from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_student
from database import get_db
from models import Course, Enrollment, LearningRequest, LearningSession, Skill, Student
from schemas import EnrollmentResponse, ProgressUpdate, SessionCreate, SessionResponse

router = APIRouter(prefix="/progress", tags=["Progress"])


def serialize(item: Enrollment) -> dict:
    return {"id": item.id, "course_id": item.course_id, "title": item.course.title, "skill": item.course.skill, "progress": item.progress, "completed_lessons": item.completed_lessons, "quiz_status": item.quiz_status}


@router.get("", response_model=list[EnrollmentResponse])
def get_progress(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return [serialize(item) for item in db.query(Enrollment).filter_by(student_id=current.id).all()]


@router.get("/sessions", response_model=list[SessionResponse])
def get_sessions(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return db.query(LearningSession).filter_by(student_id=current.id).order_by(LearningSession.scheduled_for.desc(), LearningSession.id.desc()).all()


@router.post("/sessions", response_model=SessionResponse, status_code=201)
def create_session(payload: SessionCreate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if payload.course_id is None and payload.skill_id is None and payload.request_id is None:
        raise HTTPException(status_code=422, detail="Choose a course, skill, or learning request")
    if payload.course_id is not None and db.get(Course, payload.course_id) is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if payload.skill_id is not None and db.get(Skill, payload.skill_id) is None:
        raise HTTPException(status_code=404, detail="Skill not found")
    if payload.request_id is not None:
        request = db.get(LearningRequest, payload.request_id)
        if request is None:
            raise HTTPException(status_code=404, detail="Learning request not found")
        if current.id not in (request.requester_id, request.recipient_id):
            raise HTTPException(status_code=403, detail="You did not participate in this learning request")
        if request.status not in {"accepted", "completed"}:
            raise HTTPException(status_code=409, detail="A session requires an accepted learning request")
    item = LearningSession(student_id=current.id, **payload.model_dump(), status="completed")
    db.add(item)
    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise
    return item


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_progress(enrollment_id: int, payload: ProgressUpdate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    item = db.get(Enrollment, enrollment_id)
    if item is None or item.student_id != current.id:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    item.completed_lessons = min(payload.completed_lessons, item.course.lessons)
    item.progress = round(item.completed_lessons / item.course.lessons * 100)
    if payload.quiz_status is not None:
        item.quiz_status = payload.quiz_status
    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise
    return serialize(item)
