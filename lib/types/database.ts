export type Quarter = {
  id: string
  name: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Session = {
  id: string
  quarter_id: string
  session_number: number
  session_date: string
  start_time: string
  end_time: string
  is_completed: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type User = {
  id: string
  full_name: string
  email: string
  student_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type QuarterEnrollment = {
  id: string
  user_id: string
  quarter_id: string
  created_at: string
}

export type CheckInStatus = "on_time" | "late" | "missing" | "excused_absence"

export type CheckIn = {
  id: string
  user_id: string
  session_id: string
  check_in_time: string
  status: CheckInStatus
  minutes_late: number
  created_at: string
  updated_at: string
}

export type CheckOut = {
  id: string
  user_id: string
  session_id: string
  check_out_time: string
  check_in_time: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export type ContributionQuality = "low" | "medium" | "high"

export type Contribution = {
  id: string
  user_id: string
  session_id: string
  quality: ContributionQuality
  notes: string | null
  created_at: string
  updated_at: string
}

export type AttendanceStatus = "good" | "warning" | "danger"

export type StudentSessionSummary = {
  user_id: string
  full_name: string
  email: string
  student_id: string
  session_id: string
  session_number: number
  session_date: string
  quarter_id: string
  quarter_name: string
  check_in_status: CheckInStatus | null
  minutes_late: number | null
  total_checkout_minutes: number
  total_absence_minutes: number
  time_remaining: number
  status: AttendanceStatus
  contribution_count: number
  average_contribution_quality: number | null
  is_currently_checked_out: boolean
  current_checkout_time: string | null
}

export type StudentQuarterSummary = {
  user_id: string
  full_name: string
  email: string
  student_id: string
  quarter_id: string
  quarter_name: string
  total_sessions: number
  sessions_attended: number
  sessions_late: number
  sessions_missing: number
  total_absence_minutes: number
  total_contributions: number
  average_contribution_quality: number | null
  overall_status: AttendanceStatus
}

// Analytics View Types

export type QuarterOverviewStats = {
  quarter_id: string
  quarter_name: string
  start_date: string
  end_date: string
  total_students: number
  total_sessions: number
  completed_sessions: number
  avg_attendance_rate: number
  avg_contributions_per_student_session: number
}

export type QuarterStudentAttendance = {
  quarter_id: string
  user_id: string
  full_name: string
  email: string
  student_id: string
  total_sessions_in_quarter: number
  sessions_attended: number
  attendance_percentage: number
  sessions_on_time: number
  sessions_late: number
  sessions_missing: number
  sessions_excused: number
  total_late_minutes: number
  total_checkout_minutes: number
  total_absence_minutes: number
  time_remaining: number
  attendance_status: AttendanceStatus | "unknown"
}

export type QuarterStudentContributions = {
  quarter_id: string
  user_id: string
  full_name: string
  email: string
  student_id: string
  total_contributions: number
  total_sessions_in_quarter: number
  avg_contributions_per_session: number
  avg_contribution_rating: number | null
  low_quality_count: number
  medium_quality_count: number
  high_quality_count: number
}
