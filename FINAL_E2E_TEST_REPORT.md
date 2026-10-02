# Final E2E Test Report – CampusExchange

## Project information

- Project name: CampusExchange – Campus Skill Exchange & Micro-Learning Platform
- Architecture: React frontend + FastAPI backend + MySQL database
- Testing environment: local development environment on Windows
- Frontend URL used during verification: http://127.0.0.1:5174
- Backend URL used during verification: http://127.0.0.1:8001
- Test date: 2026-10-02
- Database: MySQL-backed application database with live records

## Test summary

| Category | Result |
| --- | --- |
| Total backend tests executed | 1 |
| Backend tests passed | 1 |
| Backend tests failed | 0 |
| Frontend lint checks | Passed |
| Frontend production build | Passed |
| API smoke checks | Passed |
| Browser smoke checks | Passed |
| Auth/security API checks | Passed |
| Critical bugs fixed | 8 |
| Remaining critical blockers | 0 |

## Feature-wise status

| Feature | Tests executed | Result | Notes |
| --- | --- | --- | --- |
| Registration | Valid and invalid registration flows | Pass | New student registration worked and persisted |
| Login | Valid, invalid, unregistered, expired/missing token flows | Pass | JWT-based login and logout were verified |
| Profile management | Self-profile read/update | Pass | Restriction to self/admin was enforced |
| Skills management | Add/remove/search/filter | Pass | Live DB-backed persistence verified |
| Matching | Reciprocal, one-way, no-match, dupes | Pass | Real skill complement logic worked |
| Requests | Pending/accepted/completed/rejected flows | Pass | Duplicate requests blocked |
| Courses | Catalog, enroll, duplicate guard | Pass | Enrollments persisted |
| Progress | Session log, duration validation, refresh | Pass | Hours and counts updated |
| Reviews | Eligible review submission and display | Pass | Review averages and received/given counts were valid |
| Admin | Data access and protected routes | Pass | Admin-only creation/edit flow worked |
| Public stats | Home statistics | Pass | Counts come from live DB |

## Matching validation

### Seeded test combinations used
- Student A: can teach Java and Python; wants to learn Data Analysis
- Student B: can teach Data Analysis; wants to learn Java
- Student C: can teach Python/SQL; wants to learn UI/UX Design
- Student D: can teach UI/UX Design and Java; wants to learn Python
- Student E: can teach Communication; wants to learn Machine Learning

### Expected outcomes
- A/B reciprocal relationship for Java/Data Analysis
- one-way teaching matches where skill overlap exists but not both directions
- no match cases when learning and teaching skills do not overlap
- self-match prevented
- duplicate match cards not displayed

### Actual results
- reciprocal and one-way matches were visible on the matching page
- duplicate request attempts were rejected with conflict errors
- no self-match records were generated
- no duplicate match cards were shown in the live test UI

## Bugs found and fixed

### Bug 1 – Another student’s profile could be accessed by any authenticated user
- File: [backend/routers/students.py](backend/routers/students.py)
- Root cause: profile GET route did not enforce self/admin authorization.
- Fix: restricted access to the logged-in student or admin only.
- Regression check: API returned 403 for unauthorized profile access.

### Bug 2 – Student IDs/password validation was too loose
- File: [backend/schemas.py](backend/schemas.py)
- Root cause: malformed student IDs and overlong password strings were accepted.
- Fix: enforced student ID format and bcrypt byte-limit validation.
- Regression check: invalid student ID got 422; bad login got 401.

### Bug 3 – Duplicate active request creation was not blocked
- File: [backend/routers/requests.py](backend/routers/requests.py)
- Root cause: the backend allowed a second active request for the same request/skill combination.
- Fix: conflict detection on active requests.
- Regression check: duplicate request returned 409 and visible alert in UI.

### Bug 4 – Public homepage counts were using stale cached data
- File: [backend/routers/public.py](backend/routers/public.py)
- Root cause: the public stats route did not calculate counts from live enrollment data.
- Fix: computed counts from the relevant MySQL tables.
- Regression check: public stats endpoint returned stable live values.

### Bug 5 – Progress page lacked clear error and validation states
- File: [frontend/src/pages/Progress.jsx](frontend/src/pages/Progress.jsx)
- Root cause: session creation flow did not consistently validate and display errors.
- Fix: added validation, loading, and error handling; recent sessions persisted and refreshed correctly.
- Regression check: successful session log and refresh passed.

### Bug 6 – Profile page didn’t persist updates reliably
- File: [frontend/src/pages/Profile.jsx](frontend/src/pages/Profile.jsx)
- Root cause: profile fields were not synced with server data and save feedback was missing.
- Fix: live load + update + refresh persistence logic.
- Regression check: profile update remained after refresh.

### Bug 7 – Admin dashboard and API were inconsistent
- Files: [frontend/src/pages/Admin.jsx](frontend/src/pages/Admin.jsx), [backend/routers/admin.py](backend/routers/admin.py)
- Root cause: admin route and UI were not enforced consistently and the data was not always live.
- Fix: admin-only route guard, live overview, and protected skill/course operations.
- Regression check: non-admin redirect and admin login flow succeeded.

### Bug 8 – Legacy mock/local storage data conflicted with the real API
- Files: [frontend/src/services/storage.js](frontend/src/services/storage.js), [frontend/src/data.js](frontend/src/data.js)
- Root cause: old localStorage fixtures were not aligned with the backend and created confusion about the real data source.
- Fix: removed stale mock data paths and kept the app on the real API.
- Regression check: lint/build succeeded and app used the live backend API.

## Automated testing evidence

### Backend tests
Command run:

```powershell
$env:PYTHONPATH='C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend'; & "C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend\.venv\Scripts\python.exe" -m unittest discover -s "C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend\tests" -v
```

Result:

```text
test_returns_one_way_and_reciprocal_matches_without_self_matches ... ok

Ran 1 test in 0.000s
OK
```

### Backend compile check
Command run:

```powershell
& "C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend\.venv\Scripts\python.exe" -m py_compile ...
```

Result: exit 0, no syntax errors.

### Frontend lint
Command run:

```powershell
npm --prefix "C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend" run lint
```

Result: passed, exit 0.

### Frontend production build
Command run:

```powershell
npm --prefix "C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend" run build
```

Result: Vite build succeeded.

### Live API health and stats
Command run:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8001/public/stats -UseBasicParsing
```

Result: 200 OK.

### Security/authorization checks
Verified live results:
- invalid login: 401
- missing JWT on protected API: 401
- unauthorized profile access: 403
- invalid student ID registration: 422
- duplicate email registration: 409

## Browser validation summary

Browser smoke checks were run against the live app using the actual frontend and backend. Verified flows included:
- new registration
- login by email
- session persistence after refresh
- profile update persistence
- protected-route redirect after logout
- skill add and refresh persistence
- matching page with real matches
- duplicate active request rejection
- request acceptance and completion
- review submission and retention
- admin skill/course creation/edit
- course enrollment and progress update

## Remaining limitations

- Full scripted responsive testing across all four viewport sizes was not automated in a repo test suite.
- No repo-local Playwright suite was checked into the project; live browser checks were performed directly.
- The app remains suitable for local demonstration, but not for production deployment without additional environment hardening and monitoring.

## Final status

The project is ready for a local faculty demonstration based on actual end-to-end test evidence. No critical blocker remains in the tested user flows.
