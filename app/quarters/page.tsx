import { getSupabaseServerClient } from "@/lib/supabase/server"
import { QuartersList } from "@/components/quarters/quarters-list"
import { CreateQuarterButton } from "@/components/quarters/create-quarter-button"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function QuartersPage() {
  const supabase = await getSupabaseServerClient()
  const { data: quarters, error } = await supabase
    .from("quarters")
    .select("*")
    .order("start_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching quarters:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold">Quarters</h1>
          </div>
          <CreateQuarterButton />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <QuartersList quarters={quarters || []} />
      </div>
    </div>
  )
}
