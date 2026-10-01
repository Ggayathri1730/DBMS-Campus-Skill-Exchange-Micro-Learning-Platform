import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

load_dotenv()

from database import Base, engine, get_db
from routers import admin, auth, courses, matches, progress, public, requests, reviews, skills, students

app = FastAPI(title="Campus Skill Exchange API", version="1.0.0", description="REST API for the Campus Skill Exchange and Micro-Learning Platform")

origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5173,http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(skills.router)
app.include_router(matches.router)
app.include_router(requests.router)
app.include_router(courses.router)
app.include_router(courses.enrollments_router)
app.include_router(progress.router)
app.include_router(reviews.router)
app.include_router(admin.router)
app.include_router(public.router)


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"message": "Campus Skill Exchange API is running", "database": "connected"}
