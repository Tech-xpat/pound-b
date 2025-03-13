import Link from "next/link"
import { PhoneIcon as WhatsApp, ArrowRight, Wallet, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function GetCodePage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <Wallet className="h-12 w-12 text-primary" />
              <Coins className="h-10 w-10 -ml-2 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Get Your Access Code</h1>
          <p className="text-sm text-muted-foreground">Contact an agent via WhatsApp to receive your access code</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="text-sm">Click the button below to chat with an agent on WhatsApp</p>
            </div>

            <Button className="w-full" asChild>
              <a href="https://wa.me/2347086757575" target="_blank" rel="noopener noreferrer">
                <WhatsApp className="mr-2 h-4 w-4" />
                Chat with Agent
              </a>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/registration-guide">
                <ArrowRight className="mr-2 h-4 w-4" />
                View Registration Guide
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

