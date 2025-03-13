"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function AdminBadge() {
  const router = useRouter()
  const [clickCount, setClickCount] = useState(0)

  const handleClick = () => {
    // Increment click count
    setClickCount((prev) => {
      const newCount = prev + 1

      // If clicked 3 times, redirect to admin login
      if (newCount === 3) {
        setTimeout(() => {
          router.push("/admin")
        }, 300)
        return 0
      }

      // Reset count after 2 seconds if not clicked enough times
      setTimeout(() => {
        setClickCount(0)
      }, 2000)

      return newCount
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className="opacity-40 hover:opacity-70 transition-opacity focus:outline-none"
            aria-label="System status"
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">System status: Online</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

