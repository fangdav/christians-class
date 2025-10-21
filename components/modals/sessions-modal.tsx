"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, Quarter } from "@/lib/types/database"
import { Plus, Clock } from "lucide-react"
import { CreateSessionModal } from "./create-session-modal"
import { SessionDetailModal } from "./session-detail-modal"

interface SessionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionsModal({ open, onOpenChange }: SessionsModalProps) {
  const [sessions, setSessions] = useState<(Session & { quarter: Quarter })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  useEffect(() => {
    if (open) {
      fetchSessions()
    }
  }, [open])

  const fetchSessions = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("sessions")
      .select("*, quarter:quarters(*)")
      .is("deleted_at", null)
      .order("session_date", { ascending: false })

    if (!error && data) {
      setSessions(data as any)
    }
    setIsLoading(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Sessions</DialogTitle>
            <DialogDescription>Manage class sessions and track attendance.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">All Sessions</h3>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sessions found. Create your first session to get started.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">
                          {session.quarter.name} - Session {session.session_number}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.session_date).toLocaleDateString()} • {session.start_time} -{" "}
                          {session.end_time}
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

      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) fetchSessions()
        }}
      />

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
        />
      )}
    </>
  )
}
