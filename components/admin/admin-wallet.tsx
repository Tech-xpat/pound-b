"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdmin } from "@/lib/admin-context"
import { formatCurrency } from "@/lib/utils"

export function AdminWallet() {
  const { user } = useAdmin()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isCrediting, setIsCrediting] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [pin, setPin] = useState("")
  const [showPinDialog, setShowPinDialog] = useState(false)

  useEffect(() => {
    fetchWalletBalance()
  }, [])

  const fetchWalletBalance = async () => {
    if (!user) return
    setLoading(true)
    try {
      const walletDoc = await getDoc(doc(db, "adminWallet", user.uid))
      if (walletDoc.exists()) {
        setBalance(walletDoc.data().balance || 0)
      } else {
        // Initialize wallet if it doesn't exist
        await updateDoc(doc(db, "adminWallet", user.uid), { balance: 0 })
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error)
      setError("Failed to fetch wallet balance")
    } finally {
      setLoading(false)
    }
  }

  const handleCredit = () => {
    setShowPinDialog(true)
  }

  const confirmCredit = async () => {
    if (!user) return
    setIsCrediting(true)
    setError("")
    setSuccess("")

    try {
      // Here you would integrate with Flutterwave API to process the transaction
      // For this example, we'll just update the balance in Firestore
      const amount = Number.parseFloat(creditAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount")
      }

      // Verify PIN (in a real scenario, this should be done securely)
      if (pin !== "1234") {
        // Replace with actual PIN verification
        throw new Error("Invalid PIN")
      }

      const walletRef = doc(db, "adminWallet", user.uid)
      await updateDoc(walletRef, {
        balance: increment(amount),
      })

      setBalance((prevBalance) => prevBalance + amount)
      setSuccess(`Successfully credited ${formatCurrency(amount)} to admin wallet`)
      setCreditAmount("")
      setPin("")
    } catch (error) {
      console.error("Error crediting wallet:", error)
      setError(error.message || "Failed to credit wallet")
    } finally {
      setIsCrediting(false)
      setShowPinDialog(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Balance: {formatCurrency(balance)}</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="creditAmount">Credit Amount</Label>
            <Input
              id="creditAmount"
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Enter amount to credit"
            />
          </div>
          <Button onClick={handleCredit} disabled={isCrediting || !creditAmount}>
            Credit Wallet
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 bg-green-500/10 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter PIN</DialogTitle>
            <DialogDescription>Please enter your PIN to confirm the transaction</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmCredit} disabled={isCrediting || !pin}>
              {isCrediting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

