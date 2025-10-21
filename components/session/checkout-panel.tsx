"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { LogOut, LogIn } from "lucide-react"

interface CheckOutPanelProps {
  session: Session
  students: StudentSessionSummary[]
  onUpdate: () => void
}

export function CheckOutPanel({ session, students, onUpdate }: CheckOutPanelProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckOut = async (userId: string) => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase.from("check_outs").insert({
        user_id: userId,
        session_id: session.id,
        check_out_time: new Date().toISOString(),
      })

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error("[v0] Error checking out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async (userId: string) => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      // Find the most recent check-out without a check-in time
      const { data: checkOuts, error: fetchError } = await supabase
        .from("check_outs")
        .select("*")
        .eq("user_id", userId)
        .eq("session_id", session.id)
        .is("check_in_time", null)
        .order("check_out_time", { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      if (checkOuts && checkOuts.length > 0) {
        const checkOut = checkOuts[0]
        const checkInTime = new Date()
        const checkOutTime = new Date(checkOut.check_out_time)
        const durationMinutes = Math.floor((checkInTime.getTime() - checkOutTime.getTime()) / 60000)

        const { error: updateError } = await supabase
          .from("check_outs")
          .update({
            check_in_time: checkInTime.toISOString(),
            duration_minutes: durationMinutes,
          })
          .eq("id", checkOut.id)

        if (updateError) throw updateError
      }

      onUpdate()
    } catch (error) {
      console.error("[v0] Error checking in:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAbsenceStatus = (student: StudentSessionSummary) => {
    const totalAbsence = student.total_absence_minutes
    if (totalAbsence >= 45) return { color: "bg-red-600", label: "Danger" }
    if (totalAbsence >= 30) return { color: "bg-yellow-600", label: "Warning" }
    return { color: "bg-green-600", label: "Good" }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Check-Out Tracking</h3>
        <p className="text-sm text-muted-foreground">Track students leaving and returning</p>
      </div>

      <div className="space-y-2">
        {students.map((student) => {
          const status = getAbsenceStatus(student)
          return (
            <div
              key={student.user_id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{student.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={status.color}>{status.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {student.total_absence_minutes} min absent • {student.time_remaining} min remaining
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCheckOut(student.user_id)}
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Check Out
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCheckIn(student.user_id)} disabled={isLoading}>
                  <LogIn className="h-4 w-4 mr-1" />
                  Return
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
