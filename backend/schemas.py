from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class StudentBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    student_id: str = Field(min_length=2, max_length=40, pattern=r"^[a-zA-Z0-9-]+$")
    email: EmailStr
    course: str = Field(min_length=2, max_length=120)
    year: str = Field(min_length=1, max_length=40)
    bio: str = ""


class RegisterRequest(StudentBase):
    password: str = Field(min_length=6, max_length=128)

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value


class LoginRequest(BaseModel):
    login: str = Field(min_length=2)
    password: str = Field(min_length=6, max_length=128)

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_admin: bool = False


class StudentSummary(StudentResponse):
    skills_teaching: list["StudentSkillResponse"] = []
    skills_learning: list["StudentSkillResponse"] = []
    learning_hours: float = 0
    courses_completed: int = 0
    average_rating: float = 0
    review_count: int = 0


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: StudentResponse


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    course: str | None = Field(default=None, min_length=2, max_length=120)
    year: str | None = Field(default=None, min_length=1, max_length=40)
    bio: str | None = None


class SkillCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=80)


class SkillResponse(SkillCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    can_teach_count: int = 0
    wants_to_learn_count: int = 0


class StudentSkillCreate(BaseModel):
    skill_id: int
    can_teach: bool = False
    wants_to_learn: bool = False


class StudentSkillResponse(BaseModel):
    id: int
    skill_id: int
    name: str
    category: str
    can_teach: bool
    wants_to_learn: bool


class MatchResponse(BaseModel):
    student_id: int
    student_name: str
    course: str
    skill_id: int
    teaches: str
    wants: str = ""
    score: int
    match_type: Literal["one_way", "reciprocal"]
    reciprocal_skills: list[str] = Field(default_factory=list)


class RequestCreate(BaseModel):
    recipient_id: int
    skill_id: int
    title: str = Field(default="Learning exchange", min_length=2, max_length=160)
    message: str = Field(default="", max_length=2000)


class RequestStatusUpdate(BaseModel):
    status: Literal["accepted", "rejected", "completed"]


class RequestResponse(BaseModel):
    id: int
    requester_id: int
    requester_name: str
    recipient_id: int
    recipient_name: str
    skill_id: int
    skill_name: str
    title: str
    status: str
    message: str
    created_at: datetime


class CourseCreate(BaseModel):
    title: str
    skill: str
    category: str = "General"
    description: str
    level: str
    duration: str
    lessons: int = Field(ge=1)
    outline: str = ""


class CourseResponse(CourseCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    creator_id: int | None = None
    instructor: str = "Campus Exchange"
    rating: float = 0
    enrollment_count: int = 0


class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    title: str
    skill: str
    progress: int
    completed_lessons: int
    quiz_status: str


class ProgressUpdate(BaseModel):
    completed_lessons: int = Field(ge=0)
    quiz_status: str | None = Field(default=None, max_length=40)


class SessionCreate(BaseModel):
    course_id: int | None = None
    skill_id: int | None = None
    request_id: int | None = None
    scheduled_for: datetime | None = None
    duration_minutes: int = Field(ge=1, le=1440)
    notes: str = Field(default="", max_length=4000)


class SessionResponse(SessionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    status: str


class PublicStats(BaseModel):
    total_students: int
    total_skills: int
    total_courses: int
    total_completed_exchanges: int
    featured_skills: list[SkillResponse]
    featured_courses: list[CourseResponse]


class ReviewCreate(BaseModel):
    partner_id: int
    request_id: int
    rating: int = Field(ge=1, le=5)
    review: str = Field(min_length=2, max_length=2000)


class ReviewResponse(BaseModel):
    id: int
    reviewer_id: int
    reviewer_name: str
    partner_id: int
    partner_name: str
    request_id: int | None = None
    rating: int
    review: str
    created_at: datetime
