# Campus Skill Exchange & Micro-Learning Platform

A student peer-learning platform built with React/Vite, FastAPI, SQLAlchemy, and MySQL. Student profiles, skills, matches, requests, courses, enrollments, progress, sessions, and reviews are stored in the existing `campus_skill_exchange` database.

## Architecture

- `frontend/`: React pages, routing, auth context, and the shared API client.
- `backend/`: FastAPI application, JWT auth, SQLAlchemy models, routers, and additive demo seeder.
- `database/`: MySQL schema, legacy migration/sample scripts, and verification SQL.
- FastAPI reads `DATABASE_URL`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, and `CORS_ORIGINS` from `backend/.env`.
- Vite reads `VITE_API_URL` from `frontend/.env`; it defaults to `http://127.0.0.1:8000`.

## Feature Audit

| Feature | Status | Notes |
| --- | --- | --- |
| Home and public catalog | Implemented | Home statistics and featured content come from FastAPI/MySQL. |
| Registration, login, JWT, logout | Implemented | Passwords are bcrypt-hashed; protected routes validate `/auth/me` after refresh. |
| Profile | Implemented | Students update their own name, email, course/department, year, and bio. Private student records are self/admin only. |
| Skill library | Implemented | Public search/filter; signed-in students add/remove teach and learn assignments in MySQL. |
| Matching | Implemented | Computes one-way and reciprocal skill matches from current assignments; GET does not write match rows. |
| Learning requests | Implemented | Participants can view requests; recipients accept/reject pending requests; participants complete accepted requests. Duplicate active requests are blocked. |
| Courses and enrollment | Implemented | Course browsing/enrollment is available to students; admin role is required to create/edit courses. Duplicate enrollment is idempotent. |
| Learning progress and sessions | Implemented | Enrollment progress is student-scoped; learning sessions validate referenced records and request participation. |
| Reviews and ratings | Implemented | New reviews require a completed exchange; averages use received reviews. |
| Admin | Partial | Existing `is_admin` role gates admin APIs/routes. Admins can inspect platform data, add skills, and create/edit courses. No user deletion/account moderation UI is provided. |
| Demo data | Implemented | `python -m seed` adds eight predictable test accounts and related records; reruns preserve existing records. |

The current live schema contains the nine existing tables: `students`, `skills`, `student_skills`, `matches`, `learning_requests`, `courses`, `enrollments`, `sessions`, and `reviews`. The ORM columns and foreign keys were checked against MySQL. No migration or destructive schema operation was made.

### Supported limits

- Request cancellation is not available because the current MySQL status enum does not include `cancelled`.
- Course unenrollment is not exposed in the UI.
- Admin operations intentionally do not delete student, skill, or course records.
- The project has a backend unit test for matching but no automated React test runner; browser workflows are checked manually through the integrated browser.

## Local Setup (Windows)

1. Start the local MySQL service. In MySQL Workbench, run `database/schema.sql` only when creating a new empty project database. For the existing database, do not run `database/migrate.sql` automatically; inspect the current schema first. Do not use the legacy `database/sample_data.sql`; it is not idempotent. Use the backend seeder below.
2. Copy `backend/.env.example` to `backend/.env`. Set the MySQL URL and a private random JWT `SECRET_KEY`; keep the file local and do not commit it. Use the existing database name `campus_skill_exchange`.
3. In a PowerShell terminal:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

4. Seed demo rows only when you want the demo dataset. This command is explicit, idempotent, and does not run on backend startup:

```powershell
python -m seed
```

5. Start FastAPI in the backend terminal:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger: `http://127.0.0.1:8000/docs`

Health/database check: `http://127.0.0.1:8000/`

6. In a second PowerShell terminal, start the frontend:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm install
Copy-Item .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`. Ensure `backend/.env` includes that frontend origin in `CORS_ORIGINS`. If port 8000 is occupied, stop only a process you have identified as stale; otherwise choose a free backend port and set `VITE_API_URL` plus `CORS_ORIGINS` to match. The frontend and backend ports must agree with their environment settings.

## Demo Accounts

All accounts created by the seeder use the local test-only password `CampusDemo!2026`. Do not use these accounts outside a local demonstration.

| Role | Email | Student ID |
| --- | --- | --- |
| Demo administrator | `demo.admin@campus-exchange.example.com` | `DEMO-EX-00` |
| Student | `demo.maya@campus-exchange.example.com` | `DEMO-EX-01` |
| Student | `demo.aarav@campus-exchange.example.com` | `DEMO-EX-02` |
| Student | `demo.diya@campus-exchange.example.com` | `DEMO-EX-03` |
| Student | `demo.karan@campus-exchange.example.com` | `DEMO-EX-04` |
| Student | `demo.nia@campus-exchange.example.com` | `DEMO-EX-05` |
| Student | `demo.omar@campus-exchange.example.com` | `DEMO-EX-06` |
| Student | `demo.elena@campus-exchange.example.com` | `DEMO-EX-07` |

The seed script checks both unique email and student ID before inserting. It does not update account details, overwrite skill categories, drop tables, truncate rows, or delete data. If a reserved demo identity conflicts with an existing record, it aborts and rolls back.

## Verify and Test

Backend regression test:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
$env:PYTHONPATH = $PWD.Path
python -m unittest discover -s tests -v
```

Frontend checks:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm run lint
npm run build
```

In MySQL Workbench, select `campus_skill_exchange` and run `database/verify.sql` to inspect data relationships. The aggregate check below confirms the seeded demo population without exposing passwords:

```sql
SELECT COUNT(*) AS students FROM students;
SELECT COUNT(*) AS skill_assignments FROM student_skills;
SELECT COUNT(*) AS courses FROM courses;
SELECT COUNT(*) AS enrollments FROM enrollments;
SELECT status, COUNT(*) AS requests FROM learning_requests GROUP BY status;
SELECT COUNT(*) AS reviews FROM reviews;
```

## Faculty Walkthrough

1. Start MySQL, then FastAPI, then Vite.
2. Open the home page and show database-backed public statistics and catalog content.
3. Log in as Maya; inspect the profile and assigned skills.
4. Add a teaching or learning skill, refresh, and confirm it remains on the profile.
5. Open Matching and compare one-way and reciprocal candidates; send a request.
6. Log in as the receiving student and accept, then complete the request.
7. Return to the sender and submit a review for that completed exchange.
8. Browse courses, enroll, advance lesson progress, and log a learning session.
9. Log in as the demo administrator to inspect platform records, add a skill, and create/edit a course.
10. Refresh the pages and show that profile, enrollment, progress, requests, and reviews persist.
