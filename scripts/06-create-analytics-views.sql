-- Analytics Views for Quarter-Specific Reporting
-- These views power the analytics dashboard

-- Drop existing views first to allow column reordering
DROP VIEW IF EXISTS quarter_student_contributions;
DROP VIEW IF EXISTS quarter_student_attendance;
DROP VIEW IF EXISTS quarter_overview_stats;

-- View: Quarter overview statistics
CREATE VIEW quarter_overview_stats AS
SELECT
  q.id AS quarter_id,
  q.name AS quarter_name,
  q.start_date,
  q.end_date,

  -- Student counts
  COUNT(DISTINCT qe.user_id) AS total_students,

  -- Session counts
  COUNT(DISTINCT s.id) AS total_sessions,
  COUNT(DISTINCT CASE WHEN s.is_completed = true THEN s.id END) AS completed_sessions,

  -- Overall attendance rate (sessions with check-ins / total sessions)
  CASE
    WHEN COUNT(DISTINCT s.id) > 0 THEN
      ROUND(
        (COUNT(DISTINCT ci.session_id)::numeric /
         (COUNT(DISTINCT s.id) * GREATEST(COUNT(DISTINCT qe.user_id), 1))::numeric) * 100,
        1
      )
    ELSE 0
  END AS avg_attendance_rate,

  -- Average contribution rate
  CASE
    WHEN COUNT(DISTINCT s.id) > 0 AND COUNT(DISTINCT qe.user_id) > 0 THEN
      ROUND(
        COUNT(DISTINCT c.id)::numeric /
        (COUNT(DISTINCT s.id) * COUNT(DISTINCT qe.user_id))::numeric,
        2
      )
    ELSE 0
  END AS avg_contributions_per_student_session

FROM quarters q
LEFT JOIN quarter_enrollments qe ON q.id = qe.quarter_id
INNER JOIN users u ON qe.user_id = u.id AND u.deleted_at IS NULL
LEFT JOIN sessions s ON q.id = s.quarter_id AND s.deleted_at IS NULL
LEFT JOIN check_ins ci ON u.id = ci.user_id AND s.id = ci.session_id
LEFT JOIN contributions c ON u.id = c.user_id AND s.id = c.session_id
WHERE q.deleted_at IS NULL
GROUP BY q.id, q.name, q.start_date, q.end_date;

-- View: Student attendance by quarter
CREATE VIEW quarter_student_attendance AS
SELECT
  q.id AS quarter_id,
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,

  -- Session counts
  COUNT(DISTINCT s.id) AS total_sessions_in_quarter,
  -- sessions_attended excludes excused absences
  COUNT(DISTINCT CASE WHEN ci.status IN ('on_time', 'late') THEN ci.session_id END) AS sessions_attended,

  -- Attendance percentage (excludes excused absences from attended count)
  CASE
  WHEN COUNT(DISTINCT s.id) > 0 THEN
      ROUND(
        (COUNT(DISTINCT CASE WHEN ci.status IN ('on_time', 'late') THEN ci.session_id END)::numeric / COUNT(DISTINCT s.id)::numeric) * 100,
        1
      )
    ELSE 0
  END AS attendance_percentage,

  -- Breakdown by status
  COUNT(DISTINCT CASE WHEN ci.status = 'on_time' THEN ci.session_id END) AS sessions_on_time,
  COUNT(DISTINCT CASE WHEN ci.status = 'late' THEN ci.session_id END) AS sessions_late,
  COUNT(DISTINCT CASE WHEN ci.status = 'missing' THEN ci.session_id END) AS sessions_missing,
  COUNT(DISTINCT CASE WHEN ci.status = 'excused_absence' THEN ci.session_id END) AS sessions_excused,

  -- Total absence minutes
  COALESCE(SUM(COALESCE(ci.minutes_late, 0)), 0) AS total_late_minutes,

  -- Total checkout minutes across all sessions
  COALESCE(
    (SELECT SUM(duration_minutes)
     FROM check_outs co
     JOIN sessions s2 ON co.session_id = s2.id
     WHERE co.user_id = u.id
     AND s2.quarter_id = q.id
     AND s2.deleted_at IS NULL
     AND co.duration_minutes IS NOT NULL),
    0
  ) AS total_checkout_minutes,

  -- Total absence (late + checkout)
  COALESCE(SUM(COALESCE(ci.minutes_late, 0)), 0) + COALESCE(
    (SELECT SUM(duration_minutes)
     FROM check_outs co
     JOIN sessions s2 ON co.session_id = s2.id
     WHERE co.user_id = u.id
     AND s2.quarter_id = q.id
     AND s2.deleted_at IS NULL
     AND co.duration_minutes IS NOT NULL),
    0
  ) AS total_absence_minutes,

  -- Time remaining: 60 min per session base, or 45 if student has any excused absences
  (CASE
    WHEN COUNT(DISTINCT CASE WHEN ci.status = 'excused_absence' THEN ci.session_id END) > 0 THEN 45
    ELSE 60
   END * COUNT(DISTINCT s.id)) - (
    COALESCE(SUM(COALESCE(ci.minutes_late, 0)), 0) + COALESCE(
      (SELECT SUM(duration_minutes)
       FROM check_outs co
       JOIN sessions s2 ON co.session_id = s2.id
       WHERE co.user_id = u.id
       AND s2.quarter_id = q.id
       AND s2.deleted_at IS NULL
       AND co.duration_minutes IS NOT NULL),
      0
    )
  ) AS time_remaining,

  -- Status indicator
  CASE
    WHEN COUNT(DISTINCT s.id) = 0 THEN 'unknown'
    WHEN (COUNT(DISTINCT ci.session_id)::numeric / COUNT(DISTINCT s.id)::numeric) >= 0.9 THEN 'good'
    WHEN (COUNT(DISTINCT ci.session_id)::numeric / COUNT(DISTINCT s.id)::numeric) >= 0.7 THEN 'warning'
    ELSE 'danger'
  END AS attendance_status

FROM quarters q
CROSS JOIN users u
LEFT JOIN quarter_enrollments qe ON q.id = qe.quarter_id AND u.id = qe.user_id
LEFT JOIN sessions s ON q.id = s.quarter_id AND s.deleted_at IS NULL
LEFT JOIN check_ins ci ON u.id = ci.user_id AND s.id = ci.session_id
WHERE q.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND qe.id IS NOT NULL  -- Only students enrolled in this quarter
GROUP BY q.id, u.id, u.full_name, u.email, u.student_id;

-- View: Student contributions by quarter
CREATE VIEW quarter_student_contributions AS
SELECT
  q.id AS quarter_id,
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,

  -- Total contributions
  COUNT(c.id) AS total_contributions,

  -- Sessions count (for calculating average per session)
  COUNT(DISTINCT s.id) AS total_sessions_in_quarter,

  -- Average contributions per session
  CASE
    WHEN COUNT(DISTINCT s.id) > 0 THEN
      ROUND(COUNT(c.id)::numeric / COUNT(DISTINCT s.id)::numeric, 2)
    ELSE 0
  END AS avg_contributions_per_session,

  -- Average contribution quality (out of 5)
  ROUND(
    AVG(
      CASE
        WHEN c.quality = 'low' THEN 1
        WHEN c.quality = 'medium' THEN 3
        WHEN c.quality = 'high' THEN 5
        ELSE NULL
      END
    ),
    1
  ) AS avg_contribution_rating,

  -- Breakdown by quality
  COUNT(CASE WHEN c.quality = 'low' THEN 1 END) AS low_quality_count,
  COUNT(CASE WHEN c.quality = 'medium' THEN 1 END) AS medium_quality_count,
  COUNT(CASE WHEN c.quality = 'high' THEN 1 END) AS high_quality_count

FROM quarters q
CROSS JOIN users u
LEFT JOIN quarter_enrollments qe ON q.id = qe.quarter_id AND u.id = qe.user_id
LEFT JOIN sessions s ON q.id = s.quarter_id AND s.deleted_at IS NULL
LEFT JOIN contributions c ON u.id = c.user_id AND s.id = c.session_id
WHERE q.deleted_at IS NULL
  AND u.deleted_at IS NULL
  AND qe.id IS NOT NULL  -- Only students enrolled in this quarter
GROUP BY q.id, u.id, u.full_name, u.email, u.student_id;

-- Add comments for documentation
COMMENT ON VIEW quarter_overview_stats IS 'Aggregated statistics for each quarter including student counts, session counts, and overall rates';
COMMENT ON VIEW quarter_student_attendance IS 'Per-student attendance statistics within each quarter';
COMMENT ON VIEW quarter_student_contributions IS 'Per-student contribution statistics within each quarter';
