"use client"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart } from "@/components/ui/chart"

interface ConsistencyGraphProps {
  loading?: boolean
}

export function ConsistencyGraph({ loading = false }: ConsistencyGraphProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-[350px] w-full" />
      </Card>
    )
  }

  const data = [
    { name: "Jan", value: 10 },
    { name: "Feb", value: 20 },
    { name: "Mar", value: 15 },
    { name: "Apr", value: 25 },
    { name: "May", value: 30 },
    { name: "Jun", value: 40 },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold">Referral Consistency</h3>
        <p className="text-sm text-muted-foreground">Monthly referral performance over time</p>
      </div>
      <div className="h-[350px]">
        <LineChart
          data={data}
          categories={["value"]}
          index="name"
          colors={["hsl(var(--primary))"]}
          valueFormatter={(value: number) => `${value}`}
          className="h-full w-full"
        />
      </div>
    </div>
  )
}

