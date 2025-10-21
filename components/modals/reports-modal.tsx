"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ReportsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportsModal({ open, onOpenChange }: ReportsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reports & Analytics</DialogTitle>
          <DialogDescription>
            View attendance trends, student performance, and contribution statistics.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="contributions">Contributions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Total Students</CardTitle>
                  <CardDescription>Enrolled across all quarters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">--</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>This quarter</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">--</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
                <CardDescription>Detailed analytics and visualizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced reporting features will be available soon, including attendance trends, contribution
                  leaderboards, and at-risk student identification.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Reports</CardTitle>
                <CardDescription>Track attendance patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Attendance reporting features coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contribution Analytics</CardTitle>
                <CardDescription>View student participation metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Contribution analytics coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
