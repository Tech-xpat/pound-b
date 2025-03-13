import type React from "react"
import type { Metadata } from "next"
import { AdminProvider } from "@/lib/admin-context"
import { ThemeProvider } from "@/components/theme-provider"
import "../globals.css"

export const metadata: Metadata = {
  title: "Admin Dashboard - Pounds Bosses",
  description: "Admin dashboard for Pounds Bosses platform",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AdminProvider>{children}</AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

