"use client"

import { useState, useEffect } from "react"
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
import { formatCurrency } from "@/lib/utils"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WithdrawDialog({ open, onOpenChange }: WithdrawDialogProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    if (open && user) {
      fetchUserBalance()
    }
  }, [open, user])

  const fetchUserBalance = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setBalance(userData.balance || 0)
      }
    } catch (error) {
      console.error("Error fetching user balance:", error)
    }
  }

  const handleWithdraw = async () => {
    setError("")
    setProcessing(true)

    const withdrawAmount = Number.parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount")
      setProcessing(false)
      return
    }

    if (withdrawAmount > balance) {
      setError("Insufficient balance")
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

      // Here you would integrate with your withdrawal system
      // For this example, we'll just update the balance in Firestore
      await updateDoc(userRef, {
        balance: balance - withdrawAmount,
        transactions: [
          {
            type: "withdrawal",
            amount: withdrawAmount,
            date: new Date().toISOString(),
            status: "pending",
            reference: `wth_${Date.now()}`,
          },
          ...(userData.transactions || []),
        ],
      })

      onOpenChange(false)
      setAmount("")
      // You might want to show a success message here
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError("Failed to process withdrawal. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Enter the amount you want to withdraw. Available balance: {formatCurrency(balance)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="withdraw-amount">Amount (₦)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={balance.toString()}
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
          <Button onClick={handleWithdraw} disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

