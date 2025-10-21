"use client"

import type { Session } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClipboardList, ChevronRight, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { EditSessionModal } from "@/components/modals/edit-session-modal"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
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

interface SessionsListProps {
  sessions: Session[]
  quarterId: string
}

export function SessionsList({ sessions, quarterId }: SessionsListProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleEdit = (e: React.MouseEvent, session: Session) => {
    e.preventDefault() // Prevent Link navigation
    setSelectedSession(session)
    setShowEditModal(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, session: Session) => {
    e.preventDefault() // Prevent Link navigation
    setSessionToDelete(session)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return

    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", sessionToDelete.id)

      if (error) throw error

      setShowDeleteDialog(false)
      setSessionToDelete(null)
      router.refresh()
    } catch (err) {
      console.error("Failed to delete session:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
          <p className="text-muted-foreground mb-4">Create your first class session to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4">
        {sessions.map((session) => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <Card className="hover:bg-accent transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Session {session.session_number}</CardTitle>
                    <CardDescription className="mt-1">
                      {format(new Date(session.session_date), "EEEE, MMM d, yyyy")} • {session.start_time} -{" "}
                      {session.end_time}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleEdit(e, session)}
                      title="Edit session"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDeleteClick(e, session)}
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {selectedSession && (
        <EditSessionModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              setSelectedSession(null)
              router.refresh()
            }
          }}
          session={selectedSession}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "Session {sessionToDelete?.session_number}"? This will mark the session as
              deleted but preserve all associated data.
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
