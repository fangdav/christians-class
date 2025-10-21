"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { AttendancePanel } from "@/components/session/attendance-panel"
import { CheckOutPanel } from "@/components/session/checkout-panel"
import { ContributionsPanel } from "@/components/session/contributions-panel"
import { EditSessionModal } from "@/components/modals/edit-session-modal"
import { Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
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

interface SessionDetailModalProps {
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailModal({ session, open, onOpenChange }: SessionDetailModalProps) {
  const [students, setStudents] = useState<StudentSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetchSessionData()
    }
  }, [open, session.id])

  const fetchSessionData = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    // Get students enrolled in the session's quarter
    const { data: enrolledStudents, error: enrollmentError } = await supabase
      .from("quarter_enrollments")
      .select("user_id")
      .eq("quarter_id", session.quarter_id)

    if (enrollmentError) {
      console.error("Failed to fetch enrolled students:", enrollmentError)
      setIsLoading(false)
      return
    }

    const enrolledUserIds = enrolledStudents.map((enrollment) => enrollment.user_id)

    // Fetch session summary only for enrolled students
    const { data, error } = await supabase
      .from("student_session_summary")
      .select("*")
      .eq("session_id", session.id)
      .in("user_id", enrolledUserIds)

    if (!error && data) {
      setStudents(data)
    }
    setIsLoading(false)
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", session.id)

      if (error) throw error

      setShowDeleteDialog(false)
      onOpenChange(false) // Close the session detail modal
      router.refresh() // Refresh the page to update the UI
    } catch (err) {
      console.error("Failed to delete session:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Session {session.session_number}</DialogTitle>
              <DialogDescription>
                {new Date(session.session_date).toLocaleDateString()} • {session.start_time} - {session.end_time}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={handleEdit} title="Edit session">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleDeleteClick} title="Delete session">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="checkouts">Check-Outs</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <AttendancePanel session={session} students={students} onUpdate={fetchSessionData} />
          </TabsContent>

          <TabsContent value="checkouts" className="space-y-4">
            <CheckOutPanel session={session} students={students} onUpdate={fetchSessionData} />
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <ContributionsPanel session={session} students={students} onUpdate={fetchSessionData} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <EditSessionModal
      open={showEditModal}
      onOpenChange={(open) => {
        setShowEditModal(open)
        if (!open) {
          router.refresh()
        }
      }}
      session={session}
    />

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "Session {session.session_number}"? This will mark the session as deleted
            but preserve all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
