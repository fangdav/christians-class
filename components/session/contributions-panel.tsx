"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { Plus } from "lucide-react"

interface ContributionsPanelProps {
  session: Session
  students: StudentSessionSummary[]
  onUpdate: () => void
}

export function ContributionsPanel({ session, students, onUpdate }: ContributionsPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [quality, setQuality] = useState<"low" | "medium" | "high">("medium")
  const [isLoading, setIsLoading] = useState(false)

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
      onUpdate()
    } catch (error) {
      console.error("[v0] Error adding contribution:", error)
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Track Contributions</h3>
      </div>

      <div className="flex gap-2 p-4 border border-border rounded-lg">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.user_id} value={student.user_id}>
                {student.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
