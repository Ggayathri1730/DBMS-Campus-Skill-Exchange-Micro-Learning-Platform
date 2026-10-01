from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_student, require_admin
from database import get_db
from models import Course, Enrollment, Student
from schemas import CourseCreate, CourseResponse, EnrollmentResponse

router = APIRouter(prefix="/courses", tags=["Courses"])
enrollments_router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    rows = db.query(Course, func.count(Enrollment.id)).outerjoin(Enrollment, Enrollment.course_id == Course.id).group_by(Course.id).order_by(Course.created_at.desc()).all()
    return [{**course.__dict__, "enrollment_count": count} for course, count in rows]


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, current: Student = Depends(require_admin), db: Session = Depends(get_db)):
    course = Course(**payload.model_dump(), creator_id=current.id, instructor=current.full_name)
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
    except Exception:
        db.rollback()
        raise
    return course


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, payload: CourseCreate, current: Student = Depends(require_admin), db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in payload.model_dump().items():
        setattr(course, key, value)
    try:
        db.commit()
        db.refresh(course)
    except Exception:
        db.rollback()
        raise
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, current: Student = Depends(require_admin), db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll(course_id: int, response: Response, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    course = db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    enrollment = db.query(Enrollment).filter_by(student_id=current.id, course_id=course_id).first()
    if enrollment is not None:
        response.status_code = status.HTTP_200_OK
        return serialize_enrollment(enrollment)
    enrollment = Enrollment(student_id=current.id, course_id=course_id)
    db.add(enrollment)
    course.enrollment_count += 1
    try:
        db.commit()
        db.refresh(enrollment)
    except IntegrityError:
        db.rollback()
        enrollment = db.query(Enrollment).filter_by(student_id=current.id, course_id=course_id).first()
        if enrollment is None:
            raise HTTPException(status_code=409, detail="Enrollment could not be created")
        response.status_code = status.HTTP_200_OK
    return serialize_enrollment(enrollment)


@enrollments_router.get("", response_model=list[EnrollmentResponse])
def list_enrollments(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return [serialize_enrollment(item) for item in db.query(Enrollment).filter_by(student_id=current.id).all()]


def serialize_enrollment(item: Enrollment) -> dict:
    return {"id": item.id, "course_id": item.course_id, "title": item.course.title, "skill": item.course.skill, "progress": item.progress, "completed_lessons": item.completed_lessons, "quiz_status": item.quiz_status}
