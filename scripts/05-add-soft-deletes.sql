-- Migration: Add soft delete support to core tables
-- This migration adds deleted_at columns to enable soft deletes

-- Add deleted_at to quarters table
ALTER TABLE quarters
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_quarters_deleted_at
ON quarters(deleted_at)
WHERE deleted_at IS NULL;

-- Add deleted_at to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
ON users(deleted_at)
WHERE deleted_at IS NULL;

-- Add deleted_at to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at
ON sessions(deleted_at)
WHERE deleted_at IS NULL;

-- Update existing views to exclude soft-deleted records
-- Note: Run this after views are created in 02-create-views.sql

DROP VIEW IF EXISTS student_session_summary CASCADE;
DROP VIEW IF EXISTS student_quarter_summary CASCADE;

-- Recreate student_session_summary with soft delete filter
CREATE VIEW student_session_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,
  s.id AS session_id,
  s.quarter_id,
  s.session_number,
  s.session_date,

  -- Check-in data
  ci.check_in_time,
  ci.status AS check_in_status,
  ci.minutes_late,

  -- Check-out data (sum of all check-outs for this session)
  COALESCE(SUM(co.duration_minutes), 0) AS total_checkout_minutes,

  -- Calculate total absence minutes (late minutes + checkout minutes)
  COALESCE(ci.minutes_late, 0) + COALESCE(SUM(co.duration_minutes), 0) AS total_absence_minutes,

  -- Calculate time remaining (45 minutes base - total absence)
  45 - (COALESCE(ci.minutes_late, 0) + COALESCE(SUM(co.duration_minutes), 0)) AS time_remaining,

  -- Attendance status
  CASE
    WHEN COALESCE(ci.minutes_late, 0) + COALESCE(SUM(co.duration_minutes), 0) >= 45 THEN 'danger'
    WHEN COALESCE(ci.minutes_late, 0) + COALESCE(SUM(co.duration_minutes), 0) >= 30 THEN 'warning'
    ELSE 'good'
  END AS attendance_status,

  -- Contribution data
  COUNT(DISTINCT c.id) AS contribution_count,
  AVG(
    CASE
      WHEN c.quality = 'low' THEN 1
      WHEN c.quality = 'medium' THEN 3
      WHEN c.quality = 'high' THEN 5
      ELSE NULL
    END
  ) AS avg_contribution_quality

FROM users u
CROSS JOIN sessions s
LEFT JOIN check_ins ci ON u.id = ci.user_id AND s.id = ci.session_id
LEFT JOIN check_outs co ON u.id = co.user_id AND s.id = co.session_id
LEFT JOIN contributions c ON u.id = c.user_id AND s.id = c.session_id
WHERE u.deleted_at IS NULL
  AND s.deleted_at IS NULL
GROUP BY
  u.id, u.full_name, u.email, u.student_id,
  s.id, s.quarter_id, s.session_number, s.session_date,
  ci.check_in_time, ci.status, ci.minutes_late;

-- Recreate student_quarter_summary with soft delete filter
CREATE VIEW student_quarter_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,
  q.id AS quarter_id,
  q.name AS quarter_name,
  q.start_date AS quarter_start_date,
  q.end_date AS quarter_end_date,

  -- Session counts
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN ci.status = 'on_time' THEN ci.session_id END) AS sessions_on_time,
  COUNT(DISTINCT CASE WHEN ci.status = 'late' THEN ci.session_id END) AS sessions_late,
  COUNT(DISTINCT CASE WHEN ci.status = 'missing' THEN ci.session_id END) AS sessions_missing,

  -- Total absence minutes across quarter
  SUM(COALESCE(ci.minutes_late, 0)) +
  COALESCE(
    (SELECT SUM(co.duration_minutes)
     FROM check_outs co
     JOIN sessions s2 ON co.session_id = s2.id
     WHERE co.user_id = u.id AND s2.quarter_id = q.id AND s2.deleted_at IS NULL),
    0
  ) AS total_absence_minutes,

  -- Contribution stats
  COUNT(DISTINCT c.id) AS total_contributions,
  AVG(
    CASE
      WHEN c.quality = 'low' THEN 1
      WHEN c.quality = 'medium' THEN 3
      WHEN c.quality = 'high' THEN 5
      ELSE NULL
    END
  ) AS avg_contribution_quality,

  -- Overall attendance status
  CASE
    WHEN
      SUM(COALESCE(ci.minutes_late, 0)) +
      COALESCE(
        (SELECT SUM(co.duration_minutes)
         FROM check_outs co
         JOIN sessions s2 ON co.session_id = s2.id
         WHERE co.user_id = u.id AND s2.quarter_id = q.id AND s2.deleted_at IS NULL),
        0
      ) >= 135 THEN 'danger'  -- 3+ sessions worth
    WHEN
      SUM(COALESCE(ci.minutes_late, 0)) +
      COALESCE(
        (SELECT SUM(co.duration_minutes)
         FROM check_outs co
         JOIN sessions s2 ON co.session_id = s2.id
         WHERE co.user_id = u.id AND s2.quarter_id = q.id AND s2.deleted_at IS NULL),
        0
      ) >= 90 THEN 'warning'  -- 2+ sessions worth
    ELSE 'good'
  END AS overall_status

FROM users u
CROSS JOIN quarters q
LEFT JOIN sessions s ON q.id = s.quarter_id AND s.deleted_at IS NULL
LEFT JOIN check_ins ci ON u.id = ci.user_id AND s.id = ci.session_id
LEFT JOIN contributions c ON u.id = c.user_id AND s.id = c.session_id
WHERE u.deleted_at IS NULL
  AND q.deleted_at IS NULL
GROUP BY
  u.id, u.full_name, u.email, u.student_id,
  q.id, q.name, q.start_date, q.end_date;

COMMENT ON COLUMN quarters.deleted_at IS 'Soft delete timestamp - NULL means active, timestamp means deleted';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp - NULL means active, timestamp means deleted';
COMMENT ON COLUMN sessions.deleted_at IS 'Soft delete timestamp - NULL means active, timestamp means deleted';
