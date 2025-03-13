"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, DollarSign } from "lucide-react"

interface InvestmentPlanProps {
  title: string
  amount: number
  duration: string
  returnRate: string
  features: string[]
  popular?: boolean
  onSelect: () => void
}

export function InvestmentCard({
  title,
  amount,
  duration,
  returnRate,
  features,
  popular = false,
  onSelect,
}: InvestmentPlanProps) {
  return (
    <Card className={`flex flex-col ${popular ? "border-primary shadow-md" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {popular && <Badge className="bg-primary">Popular</Badge>}
        </div>
        <CardDescription>Investment Plan</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <p className="text-3xl font-bold">₦{amount.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Minimum investment</p>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4 text-primary" />
            <span className="font-medium">{returnRate}</span>
            <span className="ml-1 text-muted-foreground">daily returns</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-primary" />
            <span className="font-medium">{duration}</span>
            <span className="ml-1 text-muted-foreground">duration</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4 text-primary" />
            <span className="font-medium">Instant</span>
            <span className="ml-1 text-muted-foreground">withdrawals</span>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-primary">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={onSelect} className="w-full" variant={popular ? "default" : "outline"}>
          Select Plan
        </Button>
      </CardFooter>
    </Card>
  )
}

