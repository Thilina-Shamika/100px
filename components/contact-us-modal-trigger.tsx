"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CircleArrowRight } from "lucide-react"
import { BookingModal } from "@/components/booking-modal"

interface ContactUsModalTriggerProps {
  label?: string
  className?: string
}

export function ContactUsModalTrigger({ label = "Contact Us", className }: ContactUsModalTriggerProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        size="lg"
        className={className || "cursor-pointer bg-[#B5FF00] hover:bg-[#9FE000] text-black font-semibold shadow-lg hover:shadow-[#B5FF00]/50 group"}
        onClick={() => setOpen(true)}
      >
        <div className="flex items-center gap-2">
          <CircleArrowRight className="group-hover:translate-x-1 transition-transform" />
          <span className="uppercase font-medium">{label}</span>
        </div>
      </Button>
      <BookingModal open={open} onOpenChange={setOpen} />
    </>
  )
}


