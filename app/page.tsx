"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Users, ClipboardList, BarChart3, Plus } from "lucide-react"
import { CreateQuarterModal } from "@/components/modals/create-quarter-modal"
import { QuartersModal } from "@/components/modals/quarters-modal"
import { SessionsModal } from "@/components/modals/sessions-modal"
import { StudentsModal } from "@/components/modals/students-modal"
import { ReportsModal } from "@/components/modals/reports-modal"

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold">Class Attendance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin Portal</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, Admin</h2>
          <p className="text-muted-foreground">
            Manage quarters, sessions, students, and track attendance all in one place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => setActiveModal("quarters")}>
            <CardHeader>
              <CalendarDays className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Quarters</CardTitle>
              <CardDescription>Manage academic quarters and terms</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => setActiveModal("sessions")}>
            <CardHeader>
              <ClipboardList className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Create and manage class sessions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => setActiveModal("students")}>
            <CardHeader>
              <Users className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Students</CardTitle>
              <CardDescription>View and manage student roster</CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => setActiveModal("reports")}>
            <CardHeader>
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Reports</CardTitle>
              <CardDescription>View analytics and insights</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks to get started</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => setActiveModal("create-quarter")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quarter
              </Button>
              <Button variant="outline" onClick={() => setActiveModal("sessions")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Session
              </Button>
              <Button variant="outline" onClick={() => setActiveModal("students")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateQuarterModal
        open={activeModal === "create-quarter"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />
      <QuartersModal open={activeModal === "quarters"} onOpenChange={(open) => !open && setActiveModal(null)} />
      <SessionsModal open={activeModal === "sessions"} onOpenChange={(open) => !open && setActiveModal(null)} />
      <StudentsModal open={activeModal === "students"} onOpenChange={(open) => !open && setActiveModal(null)} />
      <ReportsModal open={activeModal === "reports"} onOpenChange={(open) => !open && setActiveModal(null)} />
    </div>
  )
}
