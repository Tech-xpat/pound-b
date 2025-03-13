import Link from "next/link"
import { Wallet, Coins, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { MobileNav } from "@/components/mobile-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="flex items-center">
              <Wallet className="h-6 w-6 text-primary" />
              <Coins className="h-5 w-5 -ml-1 text-primary" />
            </div>
            <span className="hidden font-bold sm:inline-block">Pounds Bosses</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Dashboard
            </Link>
            <Link href="/tasks" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Tasks
            </Link>
            <Link href="/invest" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Invest
            </Link>
            <Link href="/withdraw" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Withdraw
            </Link>
          </nav>
        </div>
        <div className="flex-1" />
        <div className="flex items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
            <ModeToggle />
            <div className="block md:hidden">
              <MobileNav />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

