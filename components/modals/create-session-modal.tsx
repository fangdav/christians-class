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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Quarter } from "@/lib/types/database"
import { useRouter } from "next/navigation"

interface CreateSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSessionModal({ open, onOpenChange }: CreateSessionModalProps) {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [quarterId, setQuarterId] = useState("")
  const [sessionNumber, setSessionNumber] = useState("")
  const [sessionDate, setSessionDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("11:00")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchQuarters()
    }
  }, [open])

  const fetchQuarters = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from("quarters")
      .select("*")
      .is("deleted_at", null)
      .order("start_date", { ascending: false })

    if (data) {
      setQuarters(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()

    try {
      const { error: insertError } = await supabase.from("sessions").insert({
        quarter_id: quarterId,
        session_number: Number.parseInt(sessionNumber),
        session_date: sessionDate,
        start_time: startTime,
        end_time: endTime,
      })

      if (insertError) throw insertError

      // Reset form
      setQuarterId("")
      setSessionNumber("")
      setSessionDate("")
      setStartTime("09:00")
      setEndTime("11:00")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>Add a new class session to a quarter.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select value={quarterId} onValueChange={setQuarterId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter.id} value={quarter.id}>
                      {quarter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isLoading ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
