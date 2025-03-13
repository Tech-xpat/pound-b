"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdmin } from "@/lib/admin-context"

export function AdminCreditUser() {
  const { user } = useAdmin()
  const [userId, setUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [crediting, setCrediting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleCreditUser = async () => {
    if (!user) return
    setCrediting(true)
    setError("")
    setSuccess("")

    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (!userDoc.exists()) {
        throw new Error("User not found")
      }

      const creditAmount = Number.parseFloat(amount)
      if (isNaN(creditAmount) || creditAmount <= 0) {
        throw new Error("Invalid amount")
      }

      await updateDoc(userRef, {
        availableForWithdrawal: increment(creditAmount),
      })

      setSuccess(`Successfully credited ${creditAmount} to user ${userId}`)
      setUserId("")
      setAmount("")
    } catch (error) {
      console.error("Error crediting user:", error)
      setError(error.message || "Failed to credit user")
    } finally {
      setCrediting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter user ID" />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to credit"
            />
          </div>
          <Button onClick={handleCreditUser} disabled={crediting || !userId || !amount}>
            {crediting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crediting...
              </>
            ) : (
              "Credit User"
            )}
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
    </Card>
  )
}

