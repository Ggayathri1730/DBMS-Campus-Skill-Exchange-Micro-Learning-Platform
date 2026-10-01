from auth import hash_password
from database import SessionLocal
from models import Course, Enrollment, LearningRequest, LearningSession, Review, Skill, Student, StudentSkill

DEMO_PASSWORD = "CampusDemo!2026"

STUDENTS = (
    {"full_name": "Campus Demo Admin", "student_id": "DEMO-EX-00", "email": "demo.admin@campus-exchange.example.com", "course": "Computer Science", "year": "4th year", "bio": "Test-only administrator account.", "is_admin": True},
    {"full_name": "Maya Chen", "student_id": "DEMO-EX-01", "email": "demo.maya@campus-exchange.example.com", "course": "Computer Science", "year": "2nd year", "bio": "Enjoys explaining Python through small projects."},
    {"full_name": "Aarav Mehta", "student_id": "DEMO-EX-02", "email": "demo.aarav@campus-exchange.example.com", "course": "Information Technology", "year": "3rd year", "bio": "Learning Python and teaching Java."},
    {"full_name": "Diya Nair", "student_id": "DEMO-EX-03", "email": "demo.diya@campus-exchange.example.com", "course": "Design", "year": "2nd year", "bio": "Interested in human-centered interface design."},
    {"full_name": "Karan Rao", "student_id": "DEMO-EX-04", "email": "demo.karan@campus-exchange.example.com", "course": "Data Science", "year": "4th year", "bio": "Uses data to answer practical questions."},
    {"full_name": "Nia Patel", "student_id": "DEMO-EX-05", "email": "demo.nia@campus-exchange.example.com", "course": "Electronics", "year": "2nd year", "bio": "Practicing confident public speaking."},
    {"full_name": "Omar Hassan", "student_id": "DEMO-EX-06", "email": "demo.omar@campus-exchange.example.com", "course": "Computer Science", "year": "3rd year", "bio": "Builds web applications with React."},
    {"full_name": "Elena Garcia", "student_id": "DEMO-EX-07", "email": "demo.elena@campus-exchange.example.com", "course": "Design", "year": "1st year", "bio": "Exploring prototyping and visual design."},
)

SKILLS = (
    ("Python", "Programming"),
    ("Java", "Programming"),
    ("UI/UX Design", "Design"),
    ("Data Analysis", "Analytics"),
    ("Public Speaking", "Communication"),
    ("React.js", "Programming"),
    ("Figma", "Design"),
    ("SQL", "Data"),
)

ASSIGNMENTS = {
    "DEMO-EX-01": (("Python", True, False), ("Java", False, True)),
    "DEMO-EX-02": (("Java", True, False), ("Python", False, True)),
    "DEMO-EX-03": (("UI/UX Design", True, False), ("Data Analysis", False, True)),
    "DEMO-EX-04": (("Data Analysis", True, False), ("UI/UX Design", False, True)),
    "DEMO-EX-05": (("Public Speaking", True, False), ("Python", False, True)),
    "DEMO-EX-06": (("React.js", True, False), ("Public Speaking", False, True)),
    "DEMO-EX-07": (("Figma", True, False), ("React.js", False, True)),
}

COURSES = (
    {"title": "[Demo] Python Peer Learning", "skill": "Python", "category": "Programming", "description": "Practice Python through short, guided campus exercises.", "level": "Beginner", "duration": "3 weeks", "lessons": 6, "outline": "Syntax; functions; small projects."},
    {"title": "[Demo] Java Foundations", "skill": "Java", "category": "Programming", "description": "Build a foundation in object-oriented Java.", "level": "Beginner", "duration": "4 weeks", "lessons": 8, "outline": "Classes; methods; collections; practice."},
    {"title": "[Demo] Interface Design Studio", "skill": "UI/UX Design", "category": "Design", "description": "Explore research, wireframes, and interface critique.", "level": "Intermediate", "duration": "2 weeks", "lessons": 5, "outline": "Research; wireframes; prototype; critique."},
)


def seed_demo_data(db):
    created = {"students": 0, "skills": 0, "assignments": 0, "courses": 0}
    students = {}

    for name, category in SKILLS:
        skill = db.query(Skill).filter_by(name=name).one_or_none()
        if skill is None:
            skill = Skill(name=name, category=category)
            db.add(skill)
            created["skills"] += 1
        students.setdefault("_skills", {})[name] = skill
    db.flush()

    for record in STUDENTS:
        details = {**record, "password_hash": hash_password(DEMO_PASSWORD)}
        email_match = db.query(Student).filter_by(email=record["email"]).one_or_none()
        id_match = db.query(Student).filter_by(student_id=record["student_id"]).one_or_none()
        if email_match is not None and id_match is not None and email_match.id != id_match.id:
            raise RuntimeError(f"Demo identity conflict for {record['student_id']}")
        student = email_match or id_match
        if student is not None:
            if student.email != record["email"] or student.student_id != record["student_id"]:
                raise RuntimeError(f"Demo identity conflict for {record['student_id']}")
            if record.get("is_admin") and not student.is_admin:
                raise RuntimeError("The reserved demo admin account exists without admin privileges")
        else:
            student = Student(**details)
            db.add(student)
            db.flush()
            created["students"] += 1
        students[record["student_id"]] = student

    for student_id, assignments in ASSIGNMENTS.items():
        student = students[student_id]
        for skill_name, can_teach, wants_to_learn in assignments:
            skill = students["_skills"][skill_name]
            existing = db.query(StudentSkill).filter_by(student_id=student.id, skill_id=skill.id).one_or_none()
            if existing is None:
                db.add(StudentSkill(student_id=student.id, skill_id=skill.id, can_teach=can_teach, wants_to_learn=wants_to_learn))
                created["assignments"] += 1

    admin = students["DEMO-EX-00"]
    courses = {}
    for details in COURSES:
        course = db.query(Course).filter_by(title=details["title"]).one_or_none()
        if course is None:
            course = Course(**details, creator_id=admin.id, instructor="Campus Demo Faculty")
            db.add(course)
            db.flush()
            created["courses"] += 1
        courses[details["skill"]] = course

    enrollment_data = (
        ("DEMO-EX-01", "Python", 2),
        ("DEMO-EX-02", "Python", 6),
        ("DEMO-EX-03", "UI/UX Design", 1),
    )
    for student_id, course_key, completed in enrollment_data:
        course = courses[course_key]
        existing = db.query(Enrollment).filter_by(student_id=students[student_id].id, course_id=course.id).one_or_none()
        if existing is None:
            db.add(Enrollment(student_id=students[student_id].id, course_id=course.id, completed_lessons=completed, progress=round(completed / course.lessons * 100), quiz_status="In progress"))

    maya = students["DEMO-EX-01"]
    aarav = students["DEMO-EX-02"]
    diya = students["DEMO-EX-03"]
    karan = students["DEMO-EX-04"]
    nia = students["DEMO-EX-05"]
    python = students["_skills"]["Python"]
    uiux = students["_skills"]["UI/UX Design"]
    requests = {}
    for requester, recipient, skill, title, state, message in (
        (aarav, maya, python, "[Demo] Completed Python exchange", "completed", "Practice Python problem solving together."),
        (nia, maya, python, "[Demo] Pending Python exchange", "pending", "I would like to learn Python basics."),
        (karan, diya, uiux, "[Demo] Accepted design exchange", "accepted", "Could we practice interface critique?"),
    ):
        item = db.query(LearningRequest).filter_by(requester_id=requester.id, recipient_id=recipient.id, skill_id=skill.id, title=title).one_or_none()
        if item is None:
            item = LearningRequest(requester_id=requester.id, recipient_id=recipient.id, skill_id=skill.id, title=title, status=state, message=message)
            db.add(item)
            db.flush()
        requests[title] = item

    completed_request = requests["[Demo] Completed Python exchange"]
    for student in (maya, aarav):
        if db.query(LearningSession).filter_by(request_id=completed_request.id, student_id=student.id).first() is None:
            db.add(LearningSession(request_id=completed_request.id, student_id=student.id, skill_id=python.id, duration_minutes=45, notes="Completed demo peer-learning session.", status="completed"))
    for reviewer, partner in ((aarav, maya), (maya, aarav)):
        if db.query(Review).filter_by(reviewer_id=reviewer.id, request_id=completed_request.id).first() is None:
            db.add(Review(reviewer_id=reviewer.id, partner_id=partner.id, request_id=completed_request.id, rating=5, review="Clear explanations and a useful peer-learning exchange."))

    return created


def main():
    db = SessionLocal()
    try:
        created = seed_demo_data(db)
        db.commit()
        print("Demo seed complete. Added:", ", ".join(f"{key}={value}" for key, value in created.items()))
        print("Accounts: 1 demo administrator and 7 demo students; reruns preserve existing records.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
