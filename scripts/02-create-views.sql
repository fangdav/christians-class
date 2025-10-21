-- Create view for student session summary
CREATE OR REPLACE VIEW student_session_summary AS
SELECT 
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,
  s.id AS session_id,
  s.session_number,
  s.session_date,
  q.id AS quarter_id,
  q.name AS quarter_name,
  ci.status AS check_in_status,
  ci.minutes_late,
  COALESCE(
    (SELECT SUM(duration_minutes) 
     FROM check_outs co 
     WHERE co.user_id = u.id 
     AND co.session_id = s.id 
     AND co.duration_minutes IS NOT NULL), 
    0
  ) AS total_checkout_minutes,
  COALESCE(ci.minutes_late, 0) + COALESCE(
    (SELECT SUM(duration_minutes) 
     FROM check_outs co 
     WHERE co.user_id = u.id 
     AND co.session_id = s.id 
     AND co.duration_minutes IS NOT NULL), 
    0
  ) AS total_absence_minutes,
  45 - (COALESCE(ci.minutes_late, 0) + COALESCE(
    (SELECT SUM(duration_minutes) 
     FROM check_outs co 
     WHERE co.user_id = u.id 
     AND co.session_id = s.id 
     AND co.duration_minutes IS NOT NULL), 
    0
  )) AS time_remaining,
  CASE 
    WHEN (COALESCE(ci.minutes_late, 0) + COALESCE(
      (SELECT SUM(duration_minutes) 
       FROM check_outs co 
       WHERE co.user_id = u.id 
       AND co.session_id = s.id 
       AND co.duration_minutes IS NOT NULL), 
      0
    )) >= 45 THEN 'danger'
    WHEN (COALESCE(ci.minutes_late, 0) + COALESCE(
      (SELECT SUM(duration_minutes) 
       FROM check_outs co 
       WHERE co.user_id = u.id 
       AND co.session_id = s.id 
       AND co.duration_minutes IS NOT NULL), 
      0
    )) >= 30 THEN 'warning'
    ELSE 'good'
  END AS status,
  (SELECT COUNT(*) 
   FROM contributions c 
   WHERE c.user_id = u.id 
   AND c.session_id = s.id) AS contribution_count,
  (SELECT AVG(
     CASE quality
       WHEN 'low' THEN 1
       WHEN 'medium' THEN 3
       WHEN 'high' THEN 5
     END
   )
   FROM contributions c
   WHERE c.user_id = u.id
   AND c.session_id = s.id) AS average_contribution_quality,
  -- Check if currently checked out (has active checkout without return)
  EXISTS (
    SELECT 1
    FROM check_outs co
    WHERE co.user_id = u.id
    AND co.session_id = s.id
    AND co.check_in_time IS NULL
  ) AS is_currently_checked_out,
  -- Get the checkout time if currently checked out
  (SELECT check_out_time
   FROM check_outs co
   WHERE co.user_id = u.id
   AND co.session_id = s.id
   AND co.check_in_time IS NULL
   ORDER BY check_out_time DESC
   LIMIT 1) AS current_checkout_time
FROM users u
CROSS JOIN sessions s
JOIN quarters q ON s.quarter_id = q.id
LEFT JOIN check_ins ci ON ci.user_id = u.id AND ci.session_id = s.id
WHERE EXISTS (
  SELECT 1 FROM quarter_enrollments qe 
  WHERE qe.user_id = u.id 
  AND qe.quarter_id = q.id
);

-- Create view for student quarter summary
CREATE OR REPLACE VIEW student_quarter_summary AS
SELECT 
  u.id AS user_id,
  u.full_name,
  u.email,
  u.student_id,
  q.id AS quarter_id,
  q.name AS quarter_name,
  (SELECT COUNT(*) 
   FROM sessions s 
   WHERE s.quarter_id = q.id) AS total_sessions,
  (SELECT COUNT(*) 
   FROM check_ins ci 
   JOIN sessions s ON ci.session_id = s.id 
   WHERE ci.user_id = u.id 
   AND s.quarter_id = q.id 
   AND ci.status IN ('on_time', 'late')) AS sessions_attended,
  (SELECT COUNT(*) 
   FROM check_ins ci 
   JOIN sessions s ON ci.session_id = s.id 
   WHERE ci.user_id = u.id 
   AND s.quarter_id = q.id 
   AND ci.status = 'late') AS sessions_late,
  (SELECT COUNT(*) 
   FROM check_ins ci 
   JOIN sessions s ON ci.session_id = s.id 
   WHERE ci.user_id = u.id 
   AND s.quarter_id = q.id 
   AND ci.status = 'missing') AS sessions_missing,
  (SELECT COALESCE(SUM(
    COALESCE(ci.minutes_late, 0) + COALESCE(
      (SELECT SUM(duration_minutes) 
       FROM check_outs co 
       WHERE co.user_id = u.id 
       AND co.session_id = s.id 
       AND co.duration_minutes IS NOT NULL), 
      0
    )
  ), 0)
   FROM sessions s
   LEFT JOIN check_ins ci ON ci.session_id = s.id AND ci.user_id = u.id
   WHERE s.quarter_id = q.id) AS total_absence_minutes,
  (SELECT COUNT(*) 
   FROM contributions c 
   JOIN sessions s ON c.session_id = s.id 
   WHERE c.user_id = u.id 
   AND s.quarter_id = q.id) AS total_contributions,
  (SELECT AVG(
     CASE quality
       WHEN 'low' THEN 1
       WHEN 'medium' THEN 3
       WHEN 'high' THEN 5
     END
   )
   FROM contributions c 
   JOIN sessions s ON c.session_id = s.id 
   WHERE c.user_id = u.id 
   AND s.quarter_id = q.id) AS average_contribution_quality,
  CASE 
    WHEN (SELECT COUNT(*) 
          FROM sessions s
          LEFT JOIN check_ins ci ON ci.session_id = s.id AND ci.user_id = u.id
          WHERE s.quarter_id = q.id
          AND (COALESCE(ci.minutes_late, 0) + COALESCE(
            (SELECT SUM(duration_minutes) 
             FROM check_outs co 
             WHERE co.user_id = u.id 
             AND co.session_id = s.id 
             AND co.duration_minutes IS NOT NULL), 
            0
          )) >= 45) > 0 THEN 'danger'
    WHEN (SELECT COUNT(*) 
          FROM sessions s
          LEFT JOIN check_ins ci ON ci.session_id = s.id AND ci.user_id = u.id
          WHERE s.quarter_id = q.id
          AND (COALESCE(ci.minutes_late, 0) + COALESCE(
            (SELECT SUM(duration_minutes) 
             FROM check_outs co 
             WHERE co.user_id = u.id 
             AND co.session_id = s.id 
             AND co.duration_minutes IS NOT NULL), 
            0
          )) >= 30) > 0 THEN 'warning'
    ELSE 'good'
  END AS overall_status
FROM users u
CROSS JOIN quarters q
WHERE EXISTS (
  SELECT 1 FROM quarter_enrollments qe 
  WHERE qe.user_id = u.id 
  AND qe.quarter_id = q.id
);
