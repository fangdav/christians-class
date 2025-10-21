import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Calendar, Users } from "lucide-react"
import { format } from "date-fns"
import { SessionsList } from "@/components/sessions/sessions-list"
import { CreateSessionButton } from "@/components/sessions/create-session-button"

export default async function QuarterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()

  const { data: quarter } = await supabase.from("quarters").select("*").eq("id", id).single()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("quarter_id", id)
    .order("session_number", { ascending: true })

  const { data: enrollments } = await supabase.from("quarter_enrollments").select("*, users(*)").eq("quarter_id", id)

  if (!quarter) {
    return <div>Quarter not found</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/quarters">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">{quarter.name}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(quarter.start_date), "MMM d, yyyy")} -{" "}
                {format(new Date(quarter.end_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
          <CreateSessionButton quarterId={id} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Sessions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sessions?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total class sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Students</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enrollments?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Sessions</h2>
          <SessionsList sessions={sessions || []} quarterId={id} />
        </div>
      </div>
    </div>
  )
}
