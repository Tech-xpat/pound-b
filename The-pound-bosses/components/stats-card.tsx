"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  loading?: boolean
  color?: string
}

export function StatsCard({ title, value, description, icon: Icon, loading = false, color }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {loading ? <div className="h-4 w-24 animate-pulse rounded bg-muted"></div> : title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color || ""}`}>
          {loading ? <div className="h-8 w-20 animate-pulse rounded bg-muted"></div> : value}
        </div>
        <p className="text-xs text-muted-foreground">
          {loading ? <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted"></div> : description}
        </p>
      </CardContent>
    </Card>
  )
}

