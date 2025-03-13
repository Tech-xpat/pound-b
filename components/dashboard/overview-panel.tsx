"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
import { AlertCircle, Loader2, Wallet, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function OverviewPanel() {
  const { user } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [bonusBalance, setBonusBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showFundDialog, setShowFundDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [amount, setAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setBalance(userData.balance || 0)
        setBonusBalance(userData.bonusBalance || 0)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

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
      // Here you would integrate with Flutterwave for actual payment processing
      // For this example, we'll just update the balance in Firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        balance: balance + fundAmount,
      })

      setBalance(balance + fundAmount)
      setShowFundDialog(false)
      setAmount("")
      // You might want to show a success message here
    } catch (error) {
      console.error("Error funding account:", error)
      setError("Failed to process payment. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    setError("")
    setProcessing(true)

    const withdrawAmount = Number.parseFloat(amount)
    if (isNaN(withdrawAmount) || withdrawAmount <= 0 || withdrawAmount > balance) {
      setError("Invalid withdrawal amount")
      setProcessing(false)
      return
    }

    try {
      // Here you would integrate with your withdrawal system
      // For this example, we'll just update the balance in Firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        balance: balance - withdrawAmount,
      })

      setBalance(balance - withdrawAmount)
      setShowWithdrawDialog(false)
      setAmount("")
      // You might want to show a success message here
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      setError("Failed to process withdrawal. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Your current account balance and bonus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Main Balance:</span>
              <span className="font-semibold">{formatCurrency(balance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bonus Balance:</span>
              <span className="font-semibold">{formatCurrency(bonusBalance)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={() => setShowFundDialog(true)}>
            <Wallet className="mr-2 h-4 w-4" />
            Fund Account
          </Button>
          <Button onClick={() => setShowWithdrawDialog(true)} variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </CardFooter>
      </Card>

      {/* Fund Account Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
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

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Enter the amount you want to withdraw.</DialogDescription>
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
    </div>
  )
}

