"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Quarter } from "@/lib/types/database"
import { Plus, Calendar } from "lucide-react"
import { CreateQuarterModal } from "./create-quarter-modal"
import { Badge } from "@/components/ui/badge"

interface QuartersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuartersModal({ open, onOpenChange }: QuartersModalProps) {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (open) {
      fetchQuarters()
    }
  }, [open])

  const fetchQuarters = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase.from("quarters").select("*").order("start_date", { ascending: false })

    if (!error && data) {
      setQuarters(data)
    }
    setIsLoading(false)
  }

  const isActive = (quarter: Quarter) => {
    const now = new Date()
    const start = new Date(quarter.start_date)
    const end = new Date(quarter.end_date)
    return now >= start && now <= end
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Quarters</DialogTitle>
            <DialogDescription>Manage academic quarters and view session details.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">All Quarters</h3>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Quarter
              </Button>
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : quarters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No quarters found. Create your first quarter to get started.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {quarters.map((quarter) => (
                  <div
                    key={quarter.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{quarter.name}</h4>
                          {isActive(quarter) && (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(quarter.start_date).toLocaleDateString()} -{" "}
                          {new Date(quarter.end_date).toLocaleDateString()}
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

      <CreateQuarterModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open)
          if (!open) fetchQuarters()
        }}
      />
    </>
  )
}
