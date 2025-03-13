"use client"

import { motion } from "framer-motion"
import { Home, Wallet, Users, Settings, DollarSign } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Wallet, label: "Banking", href: "/dashboard?tab=banking" },
    { icon: DollarSign, label: "Earn", href: "/dashboard?tab=earn" },
    { icon: Users, label: "Referrals", href: "/referrals" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map(({ icon: Icon, label, href }) => {
          const isActive =
            pathname === href || (href.includes("?tab=") && pathname + href.substring(href.indexOf("?")) === href)
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

