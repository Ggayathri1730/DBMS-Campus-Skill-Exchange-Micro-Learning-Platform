from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_student, hash_password, verify_password
from database import get_db
from models import Student
from schemas import LoginRequest, RegisterRequest, StudentResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(Student).filter(or_(Student.email == payload.email, Student.student_id == payload.student_id)).first():
        raise HTTPException(status_code=409, detail="Email or student ID is already registered")
    student = Student(**payload.model_dump(exclude={"password"}), password_hash=hash_password(payload.password))
    db.add(student)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or student ID is already registered")
    return student


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(or_(Student.email == payload.login, Student.student_id == payload.login)).first()
    if student is None or not verify_password(payload.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid student ID/email or password")
    return {"access_token": create_access_token(student.id), "user": student}


@router.get("/me", response_model=StudentResponse)
def me(student: Student = Depends(get_current_student)):
    return student
