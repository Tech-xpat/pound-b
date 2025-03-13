"use client"

import { useState } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2 } from "lucide-react"

interface FundAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FundAccountDialog({ open, onOpenChange }: FundAccountDialogProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)

  const handleFund = async () => {
    setError("")
    setProcessing(true)

    const fundAmount = Number.parseFloat(amount)
    if (isNaN(fundAmount) || fundAmount < 5000) {
      setError("Minimum deposit amount is ₦5,000")
      setProcessing(false)
      return
    }

    try {
      // Get current user data
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        throw new Error("User data not found")
      }

      const userData = userDoc.data()
      const currentBalance = userData.balance || 0

      // Here you would integrate with Flutterwave for actual payment processing
      // For this example, we'll just update the balance in Firestore
      await updateDoc(userRef, {
        balance: currentBalance + fundAmount,
        totalFundedAmount: (userData.totalFundedAmount || 0) + fundAmount,
        transactions: [
          {
            type: "deposit",
            amount: fundAmount,
            date: new Date().toISOString(),
            status: "completed",
            reference: `dep_${Date.now()}`,
          },
          ...(userData.transactions || []),
        ],
      })

      onOpenChange(false)
      setAmount("")
      // You might want to show a success message here
    } catch (error) {
      console.error("Error funding account:", error)
      setError("Failed to process payment. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fund Your Account</DialogTitle>
          <DialogDescription>Enter the amount you want to deposit. Minimum deposit is ₦5,000.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="5000"
            />
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button onClick={handleFund} disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fund Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

