CREATE DATABASE IF NOT EXISTS campus_skill_exchange
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE campus_skill_exchange;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  student_id VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  course VARCHAR(120) NOT NULL,
  year VARCHAR(40) NOT NULL,
  bio TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX ix_students_name (full_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_skills_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  skill_id INT NOT NULL,
  can_teach BOOLEAN NOT NULL DEFAULT FALSE,
  wants_to_learn BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_student_skill UNIQUE (student_id, skill_id),
  CONSTRAINT ck_skill_direction CHECK (can_teach = TRUE OR wants_to_learn = TRUE),
  CONSTRAINT fk_student_skills_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_skills_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  INDEX ix_student_skills_student (student_id),
  INDEX ix_student_skills_skill (skill_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_a_id INT NOT NULL,
  student_b_id INT NOT NULL,
  skill_a_id INT NOT NULL,
  skill_b_id INT NOT NULL,
  score INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_match_pair UNIQUE (student_a_id, student_b_id, skill_a_id, skill_b_id),
  CONSTRAINT fk_matches_a FOREIGN KEY (student_a_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_b FOREIGN KEY (student_b_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_skill_a FOREIGN KEY (skill_a_id) REFERENCES skills(id),
  CONSTRAINT fk_matches_skill_b FOREIGN KEY (skill_b_id) REFERENCES skills(id),
  CONSTRAINT ck_match_students CHECK (student_a_id <> student_b_id),
  INDEX ix_matches_students (student_a_id, student_b_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  recipient_id INT NOT NULL,
  skill_id INT NOT NULL,
  title VARCHAR(160) NOT NULL DEFAULT 'Learning exchange',
  status ENUM('pending', 'accepted', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_requests_requester FOREIGN KEY (requester_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_recipient FOREIGN KEY (recipient_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_skill FOREIGN KEY (skill_id) REFERENCES skills(id),
  CONSTRAINT ck_request_students CHECK (requester_id <> recipient_id),
  INDEX ix_requests_status (status),
  INDEX ix_requests_people (requester_id, recipient_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  skill VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'General',
  description TEXT NOT NULL,
  level VARCHAR(40) NOT NULL,
  duration VARCHAR(40) NOT NULL,
  lessons INT NOT NULL,
  outline TEXT NOT NULL,
  creator_id INT NULL,
  instructor VARCHAR(120) NOT NULL DEFAULT 'Campus Exchange',
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  enrollment_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_course_lessons CHECK (lessons > 0),
  CONSTRAINT fk_courses_creator FOREIGN KEY (creator_id) REFERENCES students(id) ON DELETE SET NULL,
  INDEX ix_courses_creator (creator_id),
  INDEX ix_courses_skill (skill),
  INDEX ix_courses_category (category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  completed_lessons INT NOT NULL DEFAULT 0,
  progress INT NOT NULL DEFAULT 0,
  quiz_status VARCHAR(40) NOT NULL DEFAULT 'Not started',
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_enrollment UNIQUE (student_id, course_id),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT ck_enrollment_progress CHECK (progress BETWEEN 0 AND 100),
  INDEX ix_enrollments_student (student_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NULL,
  student_id INT NOT NULL,
  course_id INT NULL,
  skill_id INT NULL,
  scheduled_for DATETIME NULL,
  duration_minutes INT NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'completed',
  CONSTRAINT fk_sessions_request FOREIGN KEY (request_id) REFERENCES learning_requests(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_sessions_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE SET NULL,
  CONSTRAINT ck_session_duration CHECK (duration_minutes >= 0),
  INDEX ix_sessions_student (student_id),
  INDEX ix_sessions_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewer_id INT NOT NULL,
  partner_id INT NOT NULL,
  request_id INT NULL,
  rating TINYINT NOT NULL,
  review TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_partner FOREIGN KEY (partner_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_request FOREIGN KEY (request_id) REFERENCES learning_requests(id) ON DELETE SET NULL,
  CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_review_people CHECK (reviewer_id <> partner_id),
  CONSTRAINT uq_review_exchange UNIQUE (reviewer_id, partner_id, request_id),
  INDEX ix_reviews_partner (partner_id)
) ENGINE=InnoDB;
