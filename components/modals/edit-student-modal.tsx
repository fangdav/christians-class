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
import { useRouter } from "next/navigation"
import type { User, Quarter } from "@/lib/types/database"

interface EditStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: User
}

export function EditStudentModal({ open, onOpenChange, student }: EditStudentModalProps) {
  const [fullName, setFullName] = useState(student.full_name)
  const [email, setEmail] = useState(student.email)
  const [studentId, setStudentId] = useState(student.student_id)
  const [quarterId, setQuarterId] = useState("")
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      // Reset form with current student data
      setFullName(student.full_name)
      setEmail(student.email)
      setStudentId(student.student_id)
      fetchQuartersAndEnrollment()
    }
  }, [open, student])

  const fetchQuartersAndEnrollment = async () => {
    const supabase = getSupabaseBrowserClient()

    // Fetch all active quarters
    const { data: quartersData, error: quartersError } = await supabase
      .from("quarters")
      .select("*")
      .is("deleted_at", null)
      .order("start_date", { ascending: false })

    if (!quartersError && quartersData) {
      setQuarters(quartersData)
    }

    // Fetch current enrollment
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from("quarter_enrollments")
      .select("quarter_id")
      .eq("user_id", student.id)
      .single()

    if (!enrollmentError && enrollmentData) {
      setQuarterId(enrollmentData.quarter_id)
    } else if (quartersData && quartersData.length > 0) {
      // Default to first quarter if no enrollment found
      setQuarterId(quartersData[0].id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()

    try {
      // Update user information
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          email,
          student_id: studentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id)

      if (updateError) throw updateError

      // Update quarter enrollment (delete old, insert new)
      // First, delete existing enrollments
      const { error: deleteError } = await supabase
        .from("quarter_enrollments")
        .delete()
        .eq("user_id", student.id)

      if (deleteError) throw deleteError

      // Then, create new enrollment
      const { error: enrollmentError } = await supabase.from("quarter_enrollments").insert({
        user_id: student.id,
        quarter_id: quarterId,
      })

      if (enrollmentError) throw enrollmentError

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update the student information and quarter enrollment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                placeholder="e.g., John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student-id">Student ID</Label>
              <Input
                id="student-id"
                placeholder="e.g., STU001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quarter">Quarter</Label>
              <Select value={quarterId} onValueChange={setQuarterId} required>
                <SelectTrigger id="quarter">
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
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
