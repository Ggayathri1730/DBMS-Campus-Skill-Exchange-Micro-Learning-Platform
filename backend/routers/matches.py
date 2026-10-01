from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from auth import get_current_student
from database import get_db
from models import Student, StudentSkill
from schemas import MatchResponse

router = APIRouter(prefix="/matches", tags=["Matching"])


def build_match_results(student_id: int, own_skills: list[dict], other_skills: list[dict]) -> list[dict]:
    own_teach = {item["skill_id"]: item["skill_name"] for item in own_skills if item["can_teach"]}
    own_learn = {item["skill_id"]: item["skill_name"] for item in own_skills if item["wants_to_learn"]}
    candidates = defaultdict(list)
    for item in other_skills:
        if item["student_id"] != student_id:
            candidates[item["student_id"]].append(item)

    matches = []
    for candidate in candidates.values():
        profile = candidate[0]
        they_teach = {item["skill_id"]: item["skill_name"] for item in candidate if item["can_teach"]}
        they_learn = {item["skill_id"]: item["skill_name"] for item in candidate if item["wants_to_learn"]}
        desired_skills = own_learn.keys() & they_teach.keys()
        reciprocal_skills = sorted(own_teach.keys() & they_learn.keys())
        for skill_id in sorted(desired_skills):
            is_reciprocal = bool(reciprocal_skills)
            matches.append({
                "student_id": profile["student_id"],
                "student_name": profile["student_name"],
                "course": f"{profile['course']}, {profile['year']}",
                "skill_id": skill_id,
                "teaches": they_teach[skill_id],
                "wants": ", ".join(they_learn[match_id] for match_id in reciprocal_skills),
                "score": 100 if is_reciprocal else 60,
                "match_type": "reciprocal" if is_reciprocal else "one_way",
                "reciprocal_skills": [own_teach[match_id] for match_id in reciprocal_skills],
            })
    return sorted(matches, key=lambda item: (-item["score"], item["student_name"].casefold(), item["skill_id"]))


def find_matches(student_id: int, db: Session) -> list[dict]:
    own_rows = db.query(StudentSkill).options(joinedload(StudentSkill.skill)).filter(StudentSkill.student_id == student_id).all()
    other_rows = db.query(StudentSkill).options(joinedload(StudentSkill.skill), joinedload(StudentSkill.student)).filter(StudentSkill.student_id != student_id).all()
    own_skills = [{"skill_id": item.skill_id, "skill_name": item.skill.name, "can_teach": item.can_teach, "wants_to_learn": item.wants_to_learn} for item in own_rows]
    other_skills = [{
        "student_id": item.student_id,
        "student_name": item.student.full_name,
        "course": item.student.course,
        "year": item.student.year,
        "skill_id": item.skill_id,
        "skill_name": item.skill.name,
        "can_teach": item.can_teach,
        "wants_to_learn": item.wants_to_learn,
    } for item in other_rows]
    return build_match_results(student_id, own_skills, other_skills)


@router.get("", response_model=list[MatchResponse])
def get_matches(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return find_matches(current.id, db)


@router.get("/recommended", response_model=list[MatchResponse])
def get_recommended_matches(current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return sorted(find_matches(current.id, db), key=lambda item: item["score"], reverse=True)


@router.get("/{student_id}", response_model=list[MatchResponse])
def get_student_matches(student_id: int, current: Student = Depends(get_current_student), db: Session = Depends(get_db)):
    if current.id != student_id and not current.is_admin:
        raise HTTPException(status_code=403, detail="You can only view your own matches")
    if db.get(Student, student_id) is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return find_matches(student_id, db)
