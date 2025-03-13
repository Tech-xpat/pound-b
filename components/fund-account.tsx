"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3"
import { v4 as uuidv4 } from "uuid"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

interface FundAccountProps {
  onSuccess?: (amount: number) => void
}

export function FundAccount({ onSuccess }: FundAccountProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [transactionRef, setTransactionRef] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!user?.uid) return

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data())
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow numbers
    if (/^\d*$/.test(value)) {
      setAmount(value)
    }
  }

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: transactionRef,
    amount: Number(amount),
    currency: "NGN",
    payment_options: "card,banktransfer,ussd",
    customer: {
      email: userData?.email || user?.email || "",
      phone_number: userData?.phone || "",
      name: userData?.username || user?.displayName || "",
    },
    customizations: {
      title: "Pounds Bosses",
      description: "Fund your Pounds Bosses account",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  }

  const handleFlutterPayment = useFlutterwave(config)

  const verifyTransaction = async (txRef: string) => {
    setVerifying(true)
    try {
      // Call your backend API to verify the transaction
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          txRef,
          userId: user?.uid,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update user's balance in Firestore
        await updateUserBalance(Number(amount), txRef, data.transactionId)
        setSuccess(`Your account has been funded with ${formatCurrency(Number(amount))}. Redirecting to dashboard...`)
        if (onSuccess) onSuccess(Number(amount))

        // Redirect to dashboard after 5 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 5000)
      } else {
        setError("Payment verification failed. Please contact support.")
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      setError("An error occurred while verifying your payment. Please contact support.")
    } finally {
      setVerifying(false)
      setLoading(false)
    }
  }

  const updateUserBalance = async (amount: number, txRef: string, transactionId: string) => {
    if (!user?.uid) return

    try {
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const currentData = userDoc.data()
        const currentBalance = currentData.availableForWithdrawal || 0
        const currentTotalFunded = currentData.totalFundedAmount || 0
        const newBalance = currentBalance + amount
        const newTotalFunded = currentTotalFunded + amount

        // Create transaction record
        const transaction = {
          id: transactionId,
          type: "deposit",
          amount: amount,
          date: Timestamp.now().toDate().toISOString(),
          status: "completed",
          description: "Account funding via Flutterwave",
          reference: txRef,
        }

        // Update user document
        await updateDoc(userRef, {
          availableForWithdrawal: newBalance,
          totalEarnings: (currentData.totalEarnings || 0) + amount,
          totalFundedAmount: newTotalFunded, // Track total funded amount for interest calculation
          transactions: arrayUnion(transaction),
        })
      }
    } catch (error) {
      console.error("Error updating user balance:", error)
      throw error
    }
  }

  const handleFundAccount = () => {
    setError("")
    setSuccess("")

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number(amount) < 100) {
      setError("Minimum funding amount is ₦100")
      return
    }

    setLoading(true)

    // Generate a unique transaction reference
    const txRef = `PB-${uuidv4()}`
    setTransactionRef(txRef)

    // Call Flutterwave payment
    handleFlutterPayment({
      callback: (response) => {
        console.log("Payment response:", response)
        closePaymentModal()

        if (response.status === "successful") {
          verifyTransaction(txRef)
        } else {
          setError("Payment was not successful. Please try again.")
          setLoading(false)
        }
      },
      onClose: () => {
        setLoading(false)
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5 text-primary" />
            Fund Your Account
          </CardTitle>
          <CardDescription>
            Add money to your Pounds Bosses account and earn {process.env.NEXT_PUBLIC_DAILY_INTEREST_RATE || 2.5}% daily
            interest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={handleAmountChange}
              disabled={loading || verifying}
            />
            <p className="text-xs text-muted-foreground">Minimum funding amount: ₦100</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-500/10 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            <Button onClick={handleFundAccount} disabled={loading || verifying || !amount} className="w-full">
              {loading || verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {verifying ? "Verifying Payment..." : "Processing..."}
                </>
              ) : (
                "Fund Account"
              )}
            </Button>
          </div>

          <div className="rounded-md bg-muted p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Investment Information</h3>
                <div className="mt-2 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Your funded amount earns {process.env.NEXT_PUBLIC_DAILY_INTEREST_RATE || 2.5}% interest daily
                    </li>
                    <li>Interest is added directly to your available withdrawal balance</li>
                    <li>You can withdraw your funds at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

