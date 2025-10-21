"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { Check, X, Clock } from "lucide-react"

interface AttendancePanelProps {
  session: Session
  students: StudentSessionSummary[]
  onUpdate: () => void
}

export function AttendancePanel({ session, students, onUpdate }: AttendancePanelProps) {
  const [isLoading, setIsLoading] = useState(false)

  const markAttendance = async (userId: string, status: "on_time" | "late" | "missing") => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      // Calculate minutes late if status is late
      const sessionStart = new Date(`${session.session_date}T${session.start_time}`)
      const now = new Date()
      const minutesLate =
        status === "late" ? Math.max(0, Math.floor((now.getTime() - sessionStart.getTime()) / 60000)) : 0

      const { error } = await supabase.from("check_ins").upsert(
        {
          user_id: userId,
          session_id: session.id,
          status,
          minutes_late: minutesLate,
          check_in_time: new Date().toISOString(),
        },
        {
          onConflict: "user_id,session_id",
        },
      )

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error("[v0] Error marking attendance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Marked</Badge>

    switch (status) {
      case "on_time":
        return <Badge className="bg-green-600">On Time</Badge>
      case "late":
        return <Badge className="bg-yellow-600">Late</Badge>
      case "missing":
        return <Badge variant="destructive">Missing</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mark Attendance</h3>
        <p className="text-sm text-muted-foreground">{students.length} students</p>
      </div>

      <div className="space-y-2">
        {students.map((student) => (
          <div key={student.user_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{student.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.student_id}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(student.check_in_status)}
              {student.minutes_late && student.minutes_late > 0 && (
                <span className="text-sm text-muted-foreground">({student.minutes_late} min late)</span>
              )}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAttendance(student.user_id, "on_time")}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAttendance(student.user_id, "late")}
                  disabled={isLoading}
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAttendance(student.user_id, "missing")}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
