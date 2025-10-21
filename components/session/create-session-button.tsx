"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateSessionModal } from "./create-session-modal"

interface CreateSessionButtonProps {
  quarterId: string
}

export function CreateSessionButton({ quarterId }: CreateSessionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Create Session
      </Button>
      <CreateSessionModal open={open} onOpenChange={setOpen} quarterId={quarterId} />
    </>
  )
}
