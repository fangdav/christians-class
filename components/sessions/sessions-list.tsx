import type { Session } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ClipboardList, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface SessionsListProps {
  sessions: Session[]
  quarterId: string
}

export function SessionsList({ sessions, quarterId }: SessionsListProps) {
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
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  )
}
