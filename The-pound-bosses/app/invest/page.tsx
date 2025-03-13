"use client"

import { useState } from "react"
import { InvestmentCard } from "@/components/investment-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function InvestPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSelectPlan = (planTitle: string) => {
    setSelectedPlan(planTitle)
    setInvestmentAmount("")
    setError("")
  }

  const handleInvest = async () => {
    setError("")

    if (!investmentAmount || Number.parseFloat(investmentAmount) <= 0) {
      setError("Please enter a valid investment amount")
      return
    }

    // Get minimum amount based on selected plan
    let minAmount = 0
    switch (selectedPlan) {
      case "Starter Plan":
        minAmount = 5000
        break
      case "Growth Plan":
        minAmount = 20000
        break
      case "Premium Plan":
        minAmount = 50000
        break
      default:
        setError("Invalid plan selected")
        return
    }

    if (Number.parseFloat(investmentAmount) < minAmount) {
      setError(`Minimum investment for this plan is ₦${minAmount.toLocaleString()}`)
      return
    }

    setLoading(true)

    try {
      // Here you would implement the actual investment logic
      // For example, calling an API to process the investment

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Close dialog and reset state
      setSelectedPlan(null)
      setInvestmentAmount("")

      // Show success message or redirect
    } catch (error) {
      console.error("Investment error:", error)
      setError("Failed to process investment. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Investment Plans</h1>
        <p className="mt-2 text-muted-foreground">Choose an investment plan that suits your financial goals</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <InvestmentCard
          title="Starter Plan"
          amount={5000}
          duration="30 days"
          returnRate="4%"
          features={["Daily interest payouts", "Withdraw anytime", "No hidden fees", "24/7 support"]}
          onSelect={() => handleSelectPlan("Starter Plan")}
        />

        <InvestmentCard
          title="Growth Plan"
          amount={20000}
          duration="30 days"
          returnRate="4%"
          features={[
            "Daily interest payouts",
            "Withdraw anytime",
            "Priority support",
            "Referral bonuses",
            "Investment dashboard",
          ]}
          popular={true}
          onSelect={() => handleSelectPlan("Growth Plan")}
        />

        <InvestmentCard
          title="Premium Plan"
          amount={50000}
          duration="30 days"
          returnRate="4%"
          features={[
            "Daily interest payouts",
            "Withdraw anytime",
            "VIP support",
            "Enhanced referral bonuses",
            "Advanced analytics",
            "Investment strategies",
          ]}
          onSelect={() => handleSelectPlan("Premium Plan")}
        />
      </div>

      <Dialog open={!!selectedPlan} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {selectedPlan}</DialogTitle>
            <DialogDescription>
              Enter the amount you want to invest. You can withdraw your investment at any time.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Investment Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p>• 4% daily returns on your investment</p>
              <p>• Funds can be withdrawn at any time</p>
              <p>• Returns are credited to your account daily</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPlan(null)}>
              Cancel
            </Button>
            <Button onClick={handleInvest} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Invest Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

