"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"

interface ContributionRecord {
  id: string
  user_id: string
  full_name: string
  quality: "low" | "medium" | "high"
  created_at: string
}

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

  // Individual contributions state
  const [contributions, setContributions] = useState<ContributionRecord[]>([])
  const [editingContribution, setEditingContribution] = useState<ContributionRecord | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editQuality, setEditQuality] = useState<"low" | "medium" | "high">("medium")

  // Fetch individual contributions for this session
  const fetchContributions = async () => {
    const supabase = getSupabaseBrowserClient()

    try {
      const { data, error } = await supabase
        .from("contributions")
        .select(`
          id,
          user_id,
          quality,
          created_at,
          users!inner(full_name)
        `)
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        // Transform nested structure to flat
        const transformed: ContributionRecord[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          quality: item.quality,
          created_at: item.created_at,
          full_name: item.users.full_name,
        }))
        setContributions(transformed)
      }
    } catch (error) {
      console.error("Error fetching contributions:", error)
    }
  }

  // Load contributions when component mounts or session changes
  useEffect(() => {
    fetchContributions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

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
      // Refresh contributions list and parent view
      await fetchContributions()
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

  const openEditDialog = (contribution: ContributionRecord) => {
    setEditingContribution(contribution)
    setEditQuality(contribution.quality)
    setShowEditDialog(true)
  }

  const saveEdit = async () => {
    if (!editingContribution) return

    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("contributions")
        .update({ quality: editQuality })
        .eq("id", editingContribution.id)

      if (error) throw error

      setShowEditDialog(false)
      setEditingContribution(null)
      await fetchContributions()
      await onUpdate()
    } catch (error) {
      console.error("Error updating contribution:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteContribution = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contribution?")) return

    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase.from("contributions").delete().eq("id", id)

      if (error) throw error

      await fetchContributions()
      await onUpdate()
    } catch (error) {
      console.error("Error deleting contribution:", error)
    } finally {
      setIsLoading(false)
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

      <div className="space-y-2">
        <h4 className="text-sm font-medium">All Contributions ({contributions.length})</h4>
        {contributions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No individual contributions yet</p>
        ) : (
          contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <p className="font-medium">{contribution.full_name}</p>
                {getQualityBadge(contribution.quality)}
                <span className="text-xs text-muted-foreground">
                  {new Date(contribution.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(contribution)}
                  disabled={isLoading}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteContribution(contribution.id)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contribution</DialogTitle>
            <DialogDescription>
              Update quality for {editingContribution?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={editQuality} onValueChange={(v) => setEditQuality(v as "low" | "medium" | "high")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="high">High Quality</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
