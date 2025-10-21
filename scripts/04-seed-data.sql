-- Seed sample data for testing

-- Insert sample quarters
INSERT INTO quarters (name, start_date, end_date) VALUES
  ('Fall 2024', '2024-09-01', '2024-12-15'),
  ('Winter 2025', '2025-01-06', '2025-03-20')
ON CONFLICT DO NOTHING;

-- Insert sample students
INSERT INTO users (full_name, email, student_id) VALUES
  ('Alice Johnson', 'alice.johnson@example.com', 'STU001'),
  ('Bob Smith', 'bob.smith@example.com', 'STU002'),
  ('Carol Williams', 'carol.williams@example.com', 'STU003'),
  ('David Brown', 'david.brown@example.com', 'STU004'),
  ('Emma Davis', 'emma.davis@example.com', 'STU005')
ON CONFLICT DO NOTHING;

-- Enroll students in Fall 2024 quarter
INSERT INTO quarter_enrollments (user_id, quarter_id)
SELECT u.id, q.id
FROM users u
CROSS JOIN quarters q
WHERE q.name = 'Fall 2024'
ON CONFLICT DO NOTHING;

-- Insert sample sessions for Fall 2024
INSERT INTO sessions (quarter_id, session_number, session_date, start_time, end_time)
SELECT q.id, 1, '2024-09-05', '09:00:00', '11:00:00'
FROM quarters q
WHERE q.name = 'Fall 2024'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (quarter_id, session_number, session_date, start_time, end_time)
SELECT q.id, 2, '2024-09-12', '09:00:00', '11:00:00'
FROM quarters q
WHERE q.name = 'Fall 2024'
ON CONFLICT DO NOTHING;

INSERT INTO sessions (quarter_id, session_number, session_date, start_time, end_time)
SELECT q.id, 3, '2024-09-19', '09:00:00', '11:00:00'
FROM quarters q
WHERE q.name = 'Fall 2024'
ON CONFLICT DO NOTHING;
