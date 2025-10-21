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
import type { Quarter } from "@/lib/types/database"

interface EditQuarterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quarter: Quarter
}

export function EditQuarterModal({ open, onOpenChange, quarter }: EditQuarterModalProps) {
  const [name, setName] = useState(quarter.name)
  const [startDate, setStartDate] = useState(quarter.start_date)
  const [endDate, setEndDate] = useState(quarter.end_date)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Update form when quarter changes
  useEffect(() => {
    setName(quarter.name)
    setStartDate(quarter.start_date)
    setEndDate(quarter.end_date)
  }, [quarter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()

    try {
      const { error: updateError } = await supabase
        .from("quarters")
        .update({
          name,
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quarter.id)

      if (updateError) throw updateError

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quarter")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Quarter</DialogTitle>
          <DialogDescription>Update the quarter information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Quarter Name</Label>
              <Input
                id="name"
                placeholder="e.g., Fall 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Quarter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
