"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Clipboard, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GetCodeButtonProps {
  code: string
}

export function GetCodeButton({ code }: GetCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy referral code"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

