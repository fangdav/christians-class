"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Quarter } from "@/lib/types/database"
import { Plus, Calendar, Pencil, Trash2 } from "lucide-react"
import { CreateQuarterModal } from "./create-quarter-modal"
import { EditQuarterModal } from "./edit-quarter-modal"
import { Badge } from "@/components/ui/badge"
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

interface QuartersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuartersModal({ open, onOpenChange }: QuartersModalProps) {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [quarterToDelete, setQuarterToDelete] = useState<Quarter | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchQuarters()
    }
  }, [open])

  const fetchQuarters = async () => {
    setIsLoading(true)
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from("quarters")
      .select("*")
      .is("deleted_at", null)
      .order("start_date", { ascending: false })

    if (!error && data) {
      setQuarters(data)
    }
    setIsLoading(false)
  }

  const handleEdit = (quarter: Quarter) => {
    setSelectedQuarter(quarter)
    setShowEditModal(true)
  }

  const handleDeleteClick = (quarter: Quarter) => {
    setQuarterToDelete(quarter)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!quarterToDelete) return

    setIsDeleting(true)
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from("quarters")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", quarterToDelete.id)

      if (error) throw error

      setShowDeleteDialog(false)
      setQuarterToDelete(null)
      fetchQuarters()
    } catch (err) {
      console.error("Failed to delete quarter:", err)
    } finally {
      setIsDeleting(false)
    }
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
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(quarter)}
                        title="Edit quarter"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(quarter)}
                        title="Delete quarter"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      {selectedQuarter && (
        <EditQuarterModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              setSelectedQuarter(null)
              fetchQuarters()
            }
          }}
          quarter={selectedQuarter}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quarter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{quarterToDelete?.name}"? This will mark the quarter as deleted but
              preserve all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
