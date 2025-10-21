"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { User } from "@/lib/types/database"
import { Plus, UserIcon } from "lucide-react"
import { CreateStudentModal } from "./create-student-modal"

interface StudentsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentsModal({ open, onOpenChange }: StudentsModalProps) {
  const [students, setStudents] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (open) {
      fetchStudents()
    }
  }, [open])

  const fetchStudents = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.from("users").select("*").order("full_name", { ascending: true })

    if (!error && data) {
      setStudents(data)
    }
    setIsLoading(false)
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">All Students ({students.length})</h3>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
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
    </>
  )
}
