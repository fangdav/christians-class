"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  Quarter,
  QuarterOverviewStats,
  QuarterStudentAttendance,
  QuarterStudentContributions,
} from "@/lib/types/database"
import { Users, Calendar, TrendingUp, TrendingDown } from "lucide-react"

interface ReportsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportsModal({ open, onOpenChange }: ReportsModalProps) {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [selectedQuarterId, setSelectedQuarterId] = useState("")
  const [overviewStats, setOverviewStats] = useState<QuarterOverviewStats | null>(null)
  const [attendanceData, setAttendanceData] = useState<QuarterStudentAttendance[]>([])
  const [contributionsData, setContributionsData] = useState<QuarterStudentContributions[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchQuarters()
    }
  }, [open])

  useEffect(() => {
    if (selectedQuarterId) {
      fetchAnalytics()
    }
  }, [selectedQuarterId])

  const fetchQuarters = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from("quarters")
      .select("*")
      .is("deleted_at", null)
      .order("start_date", { ascending: false })

    if (data && data.length > 0) {
      setQuarters(data)
      // Auto-select the most recent quarter
      if (!selectedQuarterId) {
        setSelectedQuarterId(data[0].id)
      }
    }
  }

  const fetchAnalytics = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    // Fetch overview stats
    const { data: overview } = await supabase
      .from("quarter_overview_stats")
      .select("*")
      .eq("quarter_id", selectedQuarterId)
      .single()

    if (overview) {
      setOverviewStats(overview)
    }

    // Fetch attendance data
    const { data: attendance } = await supabase
      .from("quarter_student_attendance")
      .select("*")
      .eq("quarter_id", selectedQuarterId)
      .order("full_name", { ascending: true })

    if (attendance) {
      setAttendanceData(attendance)
    }

    // Fetch contributions data
    const { data: contributions } = await supabase
      .from("quarter_student_contributions")
      .select("*")
      .eq("quarter_id", selectedQuarterId)
      .order("full_name", { ascending: true })

    if (contributions) {
      setContributionsData(contributions)
    }

    setIsLoading(false)
  }

  const getAttendanceStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-600"
      case "warning":
        return "bg-yellow-600"
      case "danger":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getAttendanceStatusLabel = (status: string) => {
    switch (status) {
      case "good":
        return "Good"
      case "warning":
        return "Warning"
      case "danger":
        return "At Risk"
      default:
        return "Unknown"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reports & Analytics</DialogTitle>
          <DialogDescription>
            View attendance trends, student performance, and contribution statistics.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="quarter-select">Select Quarter</Label>
          <Select value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
            <SelectTrigger id="quarter-select">
              <SelectValue placeholder="Select a quarter" />
            </SelectTrigger>
            <SelectContent>
              {quarters.map((quarter) => (
                <SelectItem key={quarter.id} value={quarter.id}>
                  {quarter.name} ({new Date(quarter.start_date).toLocaleDateString()} -{" "}
                  {new Date(quarter.end_date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        ) : !selectedQuarterId ? (
          <div className="text-center py-8 text-muted-foreground">Please select a quarter to view analytics.</div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overviewStats?.total_students || 0}</div>
                    <p className="text-xs text-muted-foreground">Enrolled in this quarter</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overviewStats?.total_sessions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {overviewStats?.completed_sessions || 0} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Attendance Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{overviewStats?.avg_attendance_rate || 0}%</div>
                    <p className="text-xs text-muted-foreground">Across all sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Contributions</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {overviewStats?.avg_contributions_per_student_session.toFixed(2) || "0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">Per student per session</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription>Attendance rates for all students in this quarter</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No attendance data available for this quarter.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {attendanceData.map((student) => {
                        const timeRemainingStatus =
                          student.time_remaining > 30 * student.total_sessions_in_quarter
                            ? "text-green-600"
                            : student.time_remaining > 15 * student.total_sessions_in_quarter
                              ? "text-yellow-600"
                              : "text-red-600"

                        return (
                          <div
                            key={student.user_id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium">{student.full_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {student.sessions_attended} / {student.total_sessions_in_quarter} sessions attended
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="font-semibold">{student.attendance_percentage.toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">
                                  {student.sessions_on_time} on time • {student.sessions_late} late •{" "}
                                  {student.sessions_missing} missing
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {student.total_absence_minutes ?? 0} min absent •{" "}
                                  <span className={`font-medium ${timeRemainingStatus}`}>
                                    {student.time_remaining ?? 0} min remaining
                                  </span>
                                </div>
                              </div>
                              <Badge className={getAttendanceStatusColor(student.attendance_status)}>
                                {getAttendanceStatusLabel(student.attendance_status)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contributions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Student Contributions</CardTitle>
                  <CardDescription>Contribution stats for all students in this quarter</CardDescription>
                </CardHeader>
                <CardContent>
                  {contributionsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No contribution data available for this quarter.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {contributionsData.map((student) => (
                        <div
                          key={student.user_id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{student.full_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {student.total_contributions} total contributions
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {student.avg_contributions_per_session.toFixed(2)} per session
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.avg_contribution_rating?.toFixed(1) || "N/A"} / 5.0 avg rating
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              High: {student.high_quality_count} • Med: {student.medium_quality_count} • Low:{" "}
                              {student.low_quality_count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
