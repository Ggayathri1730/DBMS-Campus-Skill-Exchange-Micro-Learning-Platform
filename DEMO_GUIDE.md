# CampusExchange Demo Guide

## 1. Startup instructions

### Backend

1. Open PowerShell in the backend folder.
2. Activate the project virtual environment.
3. Start the API:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

4. Confirm the API is live:

```powershell
Invoke-WebRequest http://127.0.0.1:8001/ -UseBasicParsing
```

### Frontend

1. Open PowerShell in the frontend folder.
2. Start Vite:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\frontend
npm run dev -- --host 127.0.0.1 --port 5174
```

3. Open the app at:

- http://127.0.0.1:5174

## 2. Database setup

- Use the project’s existing MySQL database instance.
- Do not run destructive SQL against the production or main student database.
- For a safe local test setup, create a separate test schema or use a local development database.
- Use the existing backend seed process for demo accounts and sample data:

```powershell
cd C:\Users\anjan\OneDrive\Attachments\Desktop\Campus-Skill-Exchange\backend
.\.venv\Scripts\Activate.ps1
python -m seed
```

The seeder is additive and idempotent; rerunning it does not duplicate records.

## 3. New account workflow

1. Open the registration page.
2. Enter a valid full name, student ID, email, course/year and password.
3. Submit the form.
4. Log in using that student ID or email.
5. Refresh the page to confirm auth persistence.
6. Logout to confirm the protected pages redirect to login.

## 4. Demo credentials (development-only)

Store credentials only in the local development environment file, not in the repo. The project includes `.env.example` files and ignores local `.env` files.

Use the seeded demo account set:

| Role | Email | Password |
| --- | --- | --- |
| Admin | demo.admin@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.maya@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.aarav@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.diya@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.karan@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.nia@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.omar@campus-exchange.example.com | CampusDemo!2026 |
| Student | demo.elena@campus-exchange.example.com | CampusDemo!2026 |

## 5. Recommended demonstration sequence

1. Land on Home and show live public counts.
2. Log in as Maya.
3. Show the profile and skills.
4. Open Matching and highlight reciprocal or one-way matches.
5. Send a request to Aarav.
6. Log in as Aarav, accept the request, and complete it.
7. Return to Maya and submit a review.
8. Open Courses, enroll in a course, and show progress.
9. Log a learning session on the Progress page.
10. Log in as the admin to show skill and course management.
11. Refresh and show data persistence.

## 6. Expected matching results

The app should correctly identify:

- reciprocal matches from complementary skill pairs
- one-way teaching matches where one student can teach a skill the other wants to learn
- no match when skills do not overlap
- no self-match
- no duplicates in the match list

## 7. Request lifecycle demonstration

Use the two-student flow:

- Pending → accepted → completed
- Pending → rejected

Expected behavior:

- request appears under sent and incoming views
- status updates in both accounts
- unauthorized users cannot change status
- filter buttons reflect the actual database counts

## 8. Course and progress demonstration

- Open the Courses page.
- Enroll in a course.
- Show the course remains enrolled after refresh.
- Open Progress.
- Choose an enrolled course and skill.
- Log a learning session with duration and notes.
- Confirm the totals update.

## 9. Review demonstration

- Complete an exchange first.
- Open Reviews.
- Submit a rating and review.
- Verify it appears under Received/Given.
- Confirm the average rating updates from stored MySQL review rows.

## 10. Troubleshooting

### Backend not starting

- Check the MySQL connection settings in the backend `.env`.
- Ensure the virtual environment is active.
- Reinstall Python dependencies if needed.

```powershell
python -m pip install -r requirements.txt
```

### Frontend not loading

- Confirm `.env` has the backend origin URL.
- Ensure the Vite dev server runs on the correct port.
- Restart the frontend process.

### Demo data not appearing

- Run the backend seeder again:

```powershell
python -m seed
```

### Request or review errors

- Confirm the exchange is in the correct state.
- Ensure the actor is the correct sender/recipient.
- Check the API logs for the 4xx/5xx response and database error.

## 11. Demonstration checklist

- [ ] backend running
- [ ] frontend running
- [ ] login works
- [ ] registration works
- [ ] skill add/remove works
- [ ] matching works
- [ ] request lifecycle works
- [ ] course enrollment works
- [ ] progress logging works
- [ ] review works
- [ ] admin access works
- [ ] refresh preserves state
