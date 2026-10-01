USE campus_skill_exchange;

ALTER TABLE learning_requests ADD COLUMN title VARCHAR(160) NOT NULL DEFAULT 'Learning exchange';

ALTER TABLE courses
  ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'General',
  ADD COLUMN outline TEXT NOT NULL,
  ADD COLUMN creator_id INT NULL,
  ADD COLUMN instructor VARCHAR(120) NOT NULL DEFAULT 'Campus Exchange',
  ADD COLUMN rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN enrollment_count INT NOT NULL DEFAULT 0;

ALTER TABLE courses ADD INDEX ix_courses_creator (creator_id);
ALTER TABLE courses ADD INDEX ix_courses_skill (skill);
ALTER TABLE courses ADD INDEX ix_courses_category (category);
ALTER TABLE courses ADD CONSTRAINT fk_courses_creator FOREIGN KEY (creator_id) REFERENCES students(id) ON DELETE SET NULL;

ALTER TABLE sessions
  MODIFY COLUMN request_id INT NULL,
  ADD COLUMN student_id INT NULL,
  ADD COLUMN course_id INT NULL,
  ADD COLUMN skill_id INT NULL,
  ADD COLUMN duration_minutes INT NOT NULL DEFAULT 0;

UPDATE sessions SET student_id = (SELECT requester_id FROM learning_requests WHERE learning_requests.id = sessions.request_id) WHERE student_id IS NULL AND request_id IS NOT NULL;
ALTER TABLE sessions MODIFY COLUMN student_id INT NOT NULL;
ALTER TABLE sessions ADD INDEX ix_sessions_student (student_id);
ALTER TABLE sessions ADD INDEX ix_sessions_course (course_id);
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD CONSTRAINT uq_review_exchange UNIQUE (reviewer_id, partner_id, request_id);