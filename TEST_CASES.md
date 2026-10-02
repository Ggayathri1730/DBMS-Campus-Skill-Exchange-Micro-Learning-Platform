# Test Cases

## TC-01 Registration - valid user
- Feature: Registration
- Preconditions: no existing student with same email/student ID
- Steps: open register page, fill complete valid form, submit
- Expected: account created in DB, redirect to login, success message
- Actual: passed in live browser validation
- Status: PASS

## TC-02 Registration - duplicate email
- Feature: Registration
- Preconditions: email already exists
- Steps: register same email again
- Expected: 409 or validation error and no extra record
- Actual: duplicate email check returned 409
- Status: PASS

## TC-03 Registration - invalid student ID
- Feature: Registration
- Preconditions: invalid ID format
- Steps: use malformed ID
- Expected: validation error and 422
- Actual: 422 returned
- Status: PASS

## TC-04 Login - valid account
- Feature: Authentication
- Steps: login with valid student ID/email and correct password
- Expected: dashboard loads and auth persists
- Actual: passed
- Status: PASS

## TC-05 Login - invalid password
- Feature: Authentication
- Expected: 401 and no login
- Actual: 401 returned
- Status: PASS

## TC-06 Profile access - self only
- Feature: Authorization
- Expected: student cannot access another student profile
- Actual: 403 returned
- Status: PASS

## TC-07 Skills add/remove
- Feature: Skills
- Expected: skill saved, refreshed, removed correctly
- Actual: passed
- Status: PASS

## TC-08 Matching - reciprocal
- Feature: Matching
- Expected: complementary skills display as reciprocal match
- Actual: passed
- Status: PASS

## TC-09 Matching - one-way
- Feature: Matching
- Expected: one-way teaching match shown correctly
- Actual: passed
- Status: PASS

## TC-10 Duplicate active request block
- Feature: Requests
- Expected: second active matching request rejected
- Actual: 409 and UI alert displayed
- Status: PASS

## TC-11 Request lifecycle
- Feature: Requests
- Expected: pending → accepted → completed
- Actual: passed in live browser flow
- Status: PASS

## TC-12 Course enroll
- Feature: Courses
- Expected: enrolled course persists in DB
- Actual: passed
- Status: PASS

## TC-13 Progress log
- Feature: Progress
- Expected: session saved with duration, notes, course, skill
- Actual: passed
- Status: PASS

## TC-14 Review
- Feature: Reviews
- Expected: completed exchange eligible for review
- Actual: passed
- Status: PASS

## TC-15 Admin access control
- Feature: Admin
- Expected: only admin can access overview and protected operations
- Actual: passed
- Status: PASS
