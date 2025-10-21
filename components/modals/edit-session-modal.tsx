"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Session } from "@/lib/types/database"

interface EditSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
}

export function EditSessionModal({ open, onOpenChange, session }: EditSessionModalProps) {
  const [sessionNumber, setSessionNumber] = useState(session.session_number.toString())
  const [sessionDate, setSessionDate] = useState(session.session_date)
  const [startTime, setStartTime] = useState(session.start_time)
  const [endTime, setEndTime] = useState(session.end_time)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Update form when session changes
  useEffect(() => {
    setSessionNumber(session.session_number.toString())
    setSessionDate(session.session_date)
    setStartTime(session.start_time)
    setEndTime(session.end_time)
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()

    try {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          session_number: Number.parseInt(sessionNumber),
          session_date: sessionDate,
          start_time: startTime,
          end_time: endTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id)

      if (updateError) throw updateError

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
          <DialogDescription>Update the session information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-number">Session Number</Label>
              <Input
                id="session-number"
                type="number"
                placeholder="e.g., 1"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-date">Session Date</Label>
              <Input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
