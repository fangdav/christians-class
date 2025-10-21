import type { Quarter } from "@/lib/types/database"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CalendarDays, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface QuartersListProps {
  quarters: Quarter[]
}

export function QuartersList({ quarters }: QuartersListProps) {
  if (quarters.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No quarters yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first quarter</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {quarters.map((quarter) => (
        <Link key={quarter.id} href={`/quarters/${quarter.id}`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{quarter.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {format(new Date(quarter.start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(quarter.end_date), "MMM d, yyyy")}
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
