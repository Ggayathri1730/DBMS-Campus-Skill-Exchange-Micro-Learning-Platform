USE campus_skill_exchange;

SELECT id, full_name, student_id, email, course, year, is_admin FROM students ORDER BY id;
SELECT id, name, category FROM skills ORDER BY category, name;

SELECT s.full_name, k.name AS skill, ss.can_teach, ss.wants_to_learn
FROM student_skills ss
JOIN students s ON s.id = ss.student_id
JOIN skills k ON k.id = ss.skill_id
ORDER BY s.full_name, k.name;

SELECT a.full_name AS student_a, b.full_name AS student_b,
       sa.name AS skill_a, sb.name AS skill_b, m.score
FROM matches m
JOIN students a ON a.id = m.student_a_id
JOIN students b ON b.id = m.student_b_id
JOIN skills sa ON sa.id = m.skill_a_id
JOIN skills sb ON sb.id = m.skill_b_id
ORDER BY m.score DESC;

SELECT r.id, requester.full_name AS requester, recipient.full_name AS recipient,
       k.name AS skill, r.status, r.created_at
FROM learning_requests r
JOIN students requester ON requester.id = r.requester_id
JOIN students recipient ON recipient.id = r.recipient_id
JOIN skills k ON k.id = r.skill_id
ORDER BY r.created_at DESC;

SELECT c.id, c.title, c.skill, c.category, c.level, c.instructor,
       c.enrollment_count, c.rating
FROM courses c ORDER BY c.created_at DESC;

SELECT e.id, s.full_name, c.title, e.progress, e.completed_lessons
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
ORDER BY s.full_name, c.title;

SELECT ls.id, s.full_name, c.title AS course, k.name AS skill,
       ls.duration_minutes, ls.status, ls.scheduled_for
FROM sessions ls
JOIN students s ON s.id = ls.student_id
LEFT JOIN courses c ON c.id = ls.course_id
LEFT JOIN skills k ON k.id = ls.skill_id
ORDER BY ls.scheduled_for DESC, ls.id DESC;

SELECT rv.id, reviewer.full_name AS reviewer, partner.full_name AS partner,
       rv.rating, rv.review, rv.created_at
FROM reviews rv
JOIN students reviewer ON reviewer.id = rv.reviewer_id
JOIN students partner ON partner.id = rv.partner_id
ORDER BY rv.created_at DESC;

SELECT COUNT(*) AS total_students FROM students;
SELECT COUNT(*) AS total_skills FROM skills;
SELECT COUNT(*) AS total_courses FROM courses;
SELECT COALESCE(SUM(duration_minutes), 0) / 60 AS total_learning_hours FROM sessions;
SELECT COALESCE(AVG(rating), 0) AS average_rating, COUNT(*) AS total_reviews FROM reviews;
SELECT c.title, COUNT(e.id) AS enrollment_count
FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title ORDER BY enrollment_count DESC;
