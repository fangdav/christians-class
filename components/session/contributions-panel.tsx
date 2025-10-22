"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { Plus, Search } from "lucide-react"

interface ContributionsPanelProps {
  session: Session
  students: StudentSessionSummary[]
  onUpdate: () => void | Promise<void>
}

export function ContributionsPanel({ session, students, onUpdate }: ContributionsPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium")
  const [isLoading, setIsLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  const addContribution = async () => {
    if (!selectedStudent) return

    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase.from("contributions").insert({
        user_id: selectedStudent,
        session_id: session.id,
        quality,
      })

      if (error) throw error
      setSelectedStudent("")
      setQuality("medium")
      // Wait for update to complete before re-enabling buttons
      await onUpdate()
    } catch (error) {
      console.error("Error adding contribution:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case "high":
        return <Badge className="bg-green-600">High</Badge>
      case "medium":
        return <Badge className="bg-blue-600">Medium</Badge>
      case "low":
        return <Badge className="bg-gray-600">Low</Badge>
      default:
        return null
    }
  }

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students
    return students.filter((student) =>
      student.full_name.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [students, studentSearch])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Track Contributions</h3>
      </div>

      <div className="space-y-2 p-4 border border-border rounded-lg">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-2">No students found</div>
                ) : (
                  filteredStudents.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.full_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Select value={quality} onValueChange={(v) => setQuality(v as "low" | "medium" | "high")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Quality</SelectItem>
              <SelectItem value="medium">Medium Quality</SelectItem>
              <SelectItem value="high">High Quality</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={addContribution} disabled={!selectedStudent || isLoading}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Contribution Summary</h4>
        {students
          .filter((s) => s.contribution_count > 0)
          .map((student) => (
            <div
              key={student.user_id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div>
                <p className="font-medium">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">{student.contribution_count} contributions</p>
              </div>
              {student.average_contribution_quality && (
                <div className="text-sm text-muted-foreground">
                  Avg: {student.average_contribution_quality.toFixed(1)}/5
                </div>
              )}
            </div>
          ))}
        {students.filter((s) => s.contribution_count > 0).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No contributions recorded yet</p>
        )}
      </div>
    </div>
  )
}
