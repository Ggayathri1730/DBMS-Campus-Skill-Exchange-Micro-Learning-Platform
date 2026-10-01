from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_student
from database import get_db
from models import LearningRequest, Review, Student
from schemas import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def serialize(item: Review) -> dict:
    return {"id": item.id, "reviewer_id": item.reviewer_id, "reviewer_name": item.reviewer.full_name, "partner_id": item.partner_id, "partner_name": item.partner.full_name, "request_id": item.request_id, "rating": item.rating, "review": item.review, "created_at": item.created_at}


@router.get("", response_model=list[ReviewResponse])
def get_reviews(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    rows = db.query(Review).filter((Review.reviewer_id == current.id) | (Review.partner_id == current.id)).order_by(Review.created_at.desc()).all()
    return [serialize(row) for row in rows]


@router.get("/{student_id}", response_model=list[ReviewResponse])
def get_student_reviews(student_id: int, _: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    rows = db.query(Review).filter(Review.partner_id == student_id).order_by(Review.created_at.desc()).all()
    return [serialize(row) for row in rows]


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id == payload.partner_id or db.get(Student, payload.partner_id) is None:
        raise HTTPException(status_code=400, detail="A valid learning partner is required")
    exchange = db.get(LearningRequest, payload.request_id)
    if exchange is None:
        raise HTTPException(status_code=404, detail="Learning exchange not found")
    if exchange.status != "completed":
        raise HTTPException(status_code=409, detail="Reviews are available after an exchange is completed")
    if current.id not in (exchange.requester_id, exchange.recipient_id):
        raise HTTPException(status_code=403, detail="You did not participate in this exchange")
    expected_partner_id = exchange.recipient_id if current.id == exchange.requester_id else exchange.requester_id
    if payload.partner_id != expected_partner_id:
        raise HTTPException(status_code=422, detail="The selected partner does not match this exchange")
    duplicate = db.query(Review).filter_by(reviewer_id=current.id, request_id=exchange.id).first()
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="You have already reviewed this exchange")
    review = Review(reviewer_id=current.id, **payload.model_dump())
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A review already exists for this exchange")
    db.refresh(review)
    return serialize(review)
