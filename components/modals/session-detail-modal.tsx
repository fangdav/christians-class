"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Session, StudentSessionSummary } from "@/lib/types/database"
import { AttendancePanel } from "@/components/session/attendance-panel"
import { CheckOutPanel } from "@/components/session/checkout-panel"
import { ContributionsPanel } from "@/components/session/contributions-panel"

interface SessionDetailModalProps {
  session: Session
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SessionDetailModal({ session, open, onOpenChange }: SessionDetailModalProps) {
  const [students, setStudents] = useState<StudentSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (open) {
      fetchSessionData()
    }
  }, [open, session.id])

  const fetchSessionData = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.from("student_session_summary").select("*").eq("session_id", session.id)

    if (!error && data) {
      setStudents(data)
    }
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session {session.session_number}</DialogTitle>
          <DialogDescription>
            {new Date(session.session_date).toLocaleDateString()} • {session.start_time} - {session.end_time}
          </DialogDescription>
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
  )
}
