"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateQuarterModal } from "./create-quarter-modal"

export function CreateQuarterButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Quarter
      </Button>
      <CreateQuarterModal open={open} onOpenChange={setOpen} />
    </>
  )
}
