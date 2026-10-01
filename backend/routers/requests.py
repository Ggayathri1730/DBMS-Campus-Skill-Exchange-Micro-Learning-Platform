from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_student
from database import get_db
from models import LearningRequest, Skill, Student, StudentSkill
from schemas import RequestCreate, RequestResponse, RequestStatusUpdate

router = APIRouter(prefix="/requests", tags=["Learning requests"])


def serialize_request(item: LearningRequest) -> dict:
    return {"id": item.id, "requester_id": item.requester_id, "requester_name": item.requester.full_name, "recipient_id": item.recipient_id, "recipient_name": item.recipient.full_name, "skill_id": item.skill_id, "skill_name": item.skill.name, "title": item.title, "status": item.status, "message": item.message, "created_at": item.created_at}


@router.get("", response_model=list[RequestResponse])
def get_requests(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    rows = db.query(LearningRequest).filter((LearningRequest.requester_id == current.id) | (LearningRequest.recipient_id == current.id)).order_by(LearningRequest.created_at.desc()).all()
    return [serialize_request(row) for row in rows]


@router.post("", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(payload: RequestCreate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if payload.recipient_id == current.id:
        raise HTTPException(status_code=400, detail="You cannot request a session with yourself")
    recipient = db.get(Student, payload.recipient_id)
    if recipient is None or db.get(Skill, payload.skill_id) is None:
        raise HTTPException(status_code=404, detail="Recipient or skill not found")
    teaches_skill = db.query(StudentSkill).filter_by(student_id=recipient.id, skill_id=payload.skill_id, can_teach=True).first()
    if teaches_skill is None:
        raise HTTPException(status_code=422, detail="The recipient is not listed as teaching this skill")
    duplicate = db.query(LearningRequest).filter_by(requester_id=current.id, recipient_id=recipient.id, skill_id=payload.skill_id).filter(LearningRequest.status.in_(["pending", "accepted"])).first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="An active request for this skill already exists")
    item = LearningRequest(requester_id=current.id, **payload.model_dump())
    db.add(item)
    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise
    return serialize_request(item)


@router.api_route("/{request_id}", methods=["PUT", "PATCH"], response_model=RequestResponse)
def update_request(request_id: int, payload: RequestStatusUpdate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    item = db.get(LearningRequest, request_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Learning request not found")
    if current.id not in (item.requester_id, item.recipient_id):
        raise HTTPException(status_code=403, detail="You cannot update this request")
    if item.status == "pending" and payload.status in {"accepted", "rejected"} and current.id != item.recipient_id:
        raise HTTPException(status_code=403, detail="Only the recipient can accept or reject a request")
    if item.status == "accepted" and payload.status == "completed":
        item.status = payload.status
    elif item.status == "pending" and payload.status in {"accepted", "rejected"}:
        item.status = payload.status
    else:
        raise HTTPException(status_code=409, detail=f"Cannot change a {item.status} request to {payload.status}")
    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise
    return serialize_request(item)
