"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User, Quarter } from "@/lib/types/database"
import { Plus, UserIcon, Pencil, Trash2 } from "lucide-react"
import { CreateStudentModal } from "./create-student-modal"
import { EditStudentModal } from "./edit-student-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface StudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentsModal({ open, onOpenChange }: StudentsModalProps) {
  const [students, setStudents] = useState<User[]>([])
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchQuarters()
      fetchStudents()
    }
  }, [open])

  useEffect(() => {
    if (open) {
      fetchStudents()
    }
  }, [selectedQuarterId])

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

  const fetchStudents = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    if (selectedQuarterId === "all") {
      // Fetch all students
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .is("deleted_at", null)
        .order("full_name", { ascending: true })

      if (!error && data) {
        setStudents(data)
      }
    } else {
      // Fetch students enrolled in selected quarter
      const { data: enrollments } = await supabase
        .from("quarter_enrollments")
        .select("user_id")
        .eq("quarter_id", selectedQuarterId)

      if (enrollments && enrollments.length > 0) {
        const userIds = enrollments.map((e) => e.user_id)

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .in("id", userIds)
          .is("deleted_at", null)
          .order("full_name", { ascending: true })

        if (!error && data) {
          setStudents(data)
        }
      } else {
        setStudents([])
      }
    }

    setIsLoading(false)
  }

  const handleEdit = (student: User) => {
    setSelectedStudent(student)
    setShowEditModal(true)
  }

  const handleDeleteClick = (student: User) => {
    setStudentToDelete(student)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return

    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("users")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", studentToDelete.id)

      if (error) throw error

      setShowDeleteDialog(false)
      setStudentToDelete(null)
      fetchStudents()
    } catch (err) {
      console.error("Failed to delete student:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Students</DialogTitle>
            <DialogDescription>Manage student roster and view profiles.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4 gap-3">
              <h3 className="text-sm font-medium">
                {selectedQuarterId === "all" ? "All Students" : "Enrolled Students"} ({students.length})
              </h3>
              <div className="flex items-center gap-2">
                <Select value={selectedQuarterId} onValueChange={setSelectedQuarterId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Quarters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quarters</SelectItem>
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter.id} value={quarter.id}>
                        {quarter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </div>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found. Add your first student to get started.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{student.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {student.email} • ID: {student.student_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(student)} title="Edit student">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(student)}
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateStudentModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) fetchStudents()
        }}
      />

      {selectedStudent && (
        <EditStudentModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              setSelectedStudent(null)
              fetchStudents()
            }
          }}
          student={selectedStudent}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{studentToDelete?.full_name}"? This will mark the student as deleted but
              preserve all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
