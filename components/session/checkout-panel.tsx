"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { LogOut, LogIn } from "lucide-react"

interface CheckOutPanelProps {
  session: Session
  students: StudentSessionSummary[]
  onUpdate: () => void | Promise<void>
}

interface CheckoutState {
  isCheckedOut: boolean
  checkoutTime: string | null
}

export function CheckOutPanel({ session, students, onUpdate }: CheckOutPanelProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutStates, setCheckoutStates] = useState<Record<string, CheckoutState>>({})

  // Fetch checkout states directly from database
  const fetchCheckoutStates = async () => {
    if (students.length === 0) return

    const supabase = getSupabaseBrowserClient()
    const userIds = students.map((s) => s.user_id)

    // Query for active checkouts (check_in_time IS NULL)
    const { data: activeCheckouts } = await supabase
      .from("check_outs")
      .select("user_id, check_out_time")
      .eq("session_id", session.id)
      .in("user_id", userIds)
      .is("check_in_time", null)

    // Build state map
    const states: Record<string, CheckoutState> = {}

    // Initialize all students as not checked out
    students.forEach((student) => {
      states[student.user_id] = {
        isCheckedOut: false,
        checkoutTime: null,
      }
    })

    // Mark students with active checkouts
    if (activeCheckouts) {
      activeCheckouts.forEach((checkout) => {
        states[checkout.user_id] = {
          isCheckedOut: true,
          checkoutTime: checkout.check_out_time,
        }
      })
    }

    setCheckoutStates(states)
  }

  // Load checkout states when component mounts or students change
  useEffect(() => {
    fetchCheckoutStates()
    // fetchCheckoutStates is stable and doesn't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, session.id])

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

      // Refresh checkout states from database
      await fetchCheckoutStates()

      // Also refresh parent view data for absence minutes
      await onUpdate()
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

        // Update check_in_time; duration_minutes will be auto-calculated by database trigger
        const { error: updateError } = await supabase
          .from("check_outs")
          .update({
            check_in_time: new Date().toISOString(),
          })
          .eq("id", checkOut.id)

        if (updateError) throw updateError
      }

      // Refresh checkout states from database
      await fetchCheckoutStates()

      // Also refresh parent view data for absence minutes
      await onUpdate()
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
          // Get checkout state from direct database query instead of view
          const checkoutState = checkoutStates[student.user_id] || {
            isCheckedOut: false,
            checkoutTime: null,
          }
          const isCheckedOut = checkoutState.isCheckedOut
          const checkoutTime = checkoutState.checkoutTime
            ? new Date(checkoutState.checkoutTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null

          return (
            <div
              key={student.user_id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{student.full_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={status.color}>{status.label}</Badge>
                  {isCheckedOut ? (
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      Checked Out
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      In Session
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {student.total_absence_minutes ?? 0} min absent • {student.time_remaining ?? 0} min remaining
                  </span>
                  {isCheckedOut && checkoutTime && (
                    <span className="text-sm text-muted-foreground">• Out since {checkoutTime}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCheckOut(student.user_id)}
                  disabled={isLoading || isCheckedOut}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Check Out
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCheckIn(student.user_id)}
                  disabled={isLoading || !isCheckedOut}
                >
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
