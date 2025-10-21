"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Loader2 } from "lucide-react"

interface CreateSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quarterId: string
}

export function CreateSessionModal({ open, onOpenChange, quarterId }: CreateSessionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    session_number: "",
    session_date: "",
    start_time: "09:00",
    end_time: "11:00",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from("sessions").insert([
      {
        quarter_id: quarterId,
        session_number: Number.parseInt(formData.session_number),
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      },
    ])

    if (error) {
      console.error("Error creating session:", error)
      alert("Failed to create session. Please try again.")
    } else {
      setFormData({ session_number: "", session_date: "", start_time: "09:00", end_time: "11:00" })
      onOpenChange(false)
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>Add a new class session to this quarter.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session_number">Session Number</Label>
              <Input
                id="session_number"
                type="number"
                placeholder="e.g., 1"
                value={formData.session_number}
                onChange={(e) => setFormData({ ...formData, session_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_date">Date</Label>
              <Input
                id="session_date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
