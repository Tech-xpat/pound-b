"use client"

import { useState, useEffect } from "react"
import { doc, setDoc, Timestamp, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Copy, CheckCircle, CreditCard, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

// Function to generate a random coupon code
function generateCouponCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let coupon = ""
  for (let i = 0; i < length; i++) {
    coupon += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return coupon
}

export function CouponGenerator() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [generatedCoupon, setGeneratedCoupon] = useState("")
  const [copied, setCopied] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [transactionRef, setTransactionRef] = useState("")
  const [userData, setUserData] = useState<any>(null)
  const [couponHistory, setCouponHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setUserData(userDoc.data())

          // Extract coupon generation history from transactions
          const transactions = userDoc.data().transactions || []
          const couponTransactions = transactions.filter(
            (t: any) => t.description && t.description.includes("Coupon code generation"),
          )
          setCouponHistory(couponTransactions)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  const config = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: transactionRef,
    amount: 5000, // Fixed amount for coupon generation
    currency: "NGN",
    payment_options: "card,banktransfer,ussd",
    customer: {
      email: userData?.email || user?.email || "",
      phone_number: userData?.phone || "",
      name: userData?.username || user?.displayName || "",
    },
    customizations: {
      title: "Pounds Bosses - Coupon Generation",
      description: "Payment for coupon code generation",
      logo: "https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg",
    },
  }

  const handleFlutterPayment = useFlutterwave(config)

  const handleGenerateCoupon = () => {
    if (!user) {
      setError("You must be logged in to generate a coupon")
      return
    }

    setError("")
    setSuccess("")
    setShowPaymentForm(true)
  }

  const processPayment = () => {
    setPaymentProcessing(true)

    // Generate a unique transaction reference
    const txRef = `PB-COUPON-${uuidv4()}`
    setTransactionRef(txRef)

    // Call Flutterwave payment
    handleFlutterPayment({
      callback: (response) => {
        console.log("Payment response:", response)
        closePaymentModal()

        if (response.status === "successful") {
          verifyAndProcessCouponGeneration(txRef, response.transaction_id)
        } else {
          setError("Payment was not successful. Please try again.")
          setPaymentProcessing(false)
        }
      },
      onClose: () => {
        setPaymentProcessing(false)
      },
    })
  }

  const verifyAndProcessCouponGeneration = async (txRef: string, transactionId: string) => {
    setLoading(true)
    try {
      // Create transaction record
      const transaction = {
        id: `coupon-${Date.now()}`,
        type: "debit",
        amount: 5000,
        date: new Date().toISOString(),
        status: "completed",
        description: "Coupon code generation fee",
        reference: txRef,
      }

      // Update user's balance
      const userRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const currentBalance = userData.availableForWithdrawal || 0

        // Check if user has enough balance
        if (currentBalance < 5000) {
          // If not enough balance, add the transaction but don't deduct
          await updateDoc(userRef, {
            transactions: arrayUnion(transaction),
          })
        } else {
          // If enough balance, deduct from available balance
          await updateDoc(userRef, {
            availableForWithdrawal: currentBalance - 5000,
            transactions: arrayUnion(transaction),
          })
        }
      }

      // Generate a unique coupon code
      const couponCode = generateCouponCode()

      // Create the coupon in Firestore
      await setDoc(doc(db, "coupons", couponCode), {
        code: couponCode,
        createdAt: Timestamp.now().toDate().toISOString(),
        createdBy: user.uid,
        used: false,
        usedBy: null,
        usedAt: null,
        transactionRef: txRef,
      })

      // Add coupon generation transaction
      const couponTransaction = {
        id: `coupon-gen-${Date.now()}`,
        type: "service",
        amount: 5000,
        date: new Date().toISOString(),
        status: "completed",
        description: `Coupon code generation: ${couponCode}`,
        reference: txRef,
      }

      await updateDoc(userRef, {
        transactions: arrayUnion(couponTransaction),
      })

      // Update local state
      setCouponHistory([couponTransaction, ...couponHistory])
      setGeneratedCoupon(couponCode)
      setSuccess("Coupon generated successfully!")
      setShowPaymentForm(false)
    } catch (error) {
      console.error("Error generating coupon:", error)
      setError("Failed to generate coupon. Please try again.")
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCoupon)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Generate Coupon Code
          </CardTitle>
          <CardDescription className="text-base">
            Create a unique coupon code that you can share with others. When someone signs up using your coupon code,
            you'll earn ₦500 and they'll receive ₦5,000.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence mode="wait">
            {showPaymentForm ? (
              <motion.div
                key="payment-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Alert className="bg-yellow-500/10 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Payment Required</AlertTitle>
                  <AlertDescription>
                    A fee of ₦5,000 is required to generate a coupon code. This helps ensure quality referrals.
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <h3 className="mb-2 text-lg font-semibold">Coupon Generation Fee</h3>
                  <p className="text-3xl font-bold text-primary">₦5,000</p>
                  <p className="mt-2 text-sm text-muted-foreground">One-time fee for generating a unique coupon code</p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={paymentProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                    onClick={processPayment}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay ₦5,000
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : generatedCoupon ? (
              <motion.div
                key="coupon-display"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Coupon Code</label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        value={generatedCoupon}
                        readOnly
                        className="w-full rounded-md border-2 border-primary/30 bg-primary/5 px-4 py-2 font-mono text-lg font-bold tracking-wider text-primary"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                        <div className="h-20 w-20 rounded-full bg-primary"></div>
                        <div className="absolute h-16 w-16 rounded-full border-4 border-dashed border-white animate-spin-slow"></div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      onClick={copyToClipboard}
                      variant="outline"
                      className="h-10 w-10 rounded-md border-2 border-primary/30 hover:bg-primary/10"
                    >
                      {copied ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-primary" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share this code with others to earn ₦500 when they sign up
                  </p>
                </div>

                {success && (
                  <Alert className="bg-green-500/10 border-green-500/50 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={() => {
                    setGeneratedCoupon("")
                    setSuccess("")
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Generate Another Code
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="generate-button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-primary/60" />
                  <h3 className="mt-4 text-lg font-semibold">Generate a New Coupon Code</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A fee of ₦5,000 will be charged to generate a unique coupon code
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGenerateCoupon}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Coupon Code"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/50 px-6 py-4">
          <p className="text-xs text-muted-foreground">Coupon codes are unique and can only be used once</p>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="text-xs">
            {showHistory ? "Hide History" : "View History"}
          </Button>
        </CardFooter>
      </Card>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardHeader>
                <CardTitle>Your Coupon History</CardTitle>
                <CardDescription>Previously generated coupon codes</CardDescription>
              </CardHeader>
              <CardContent>
                {couponHistory.length > 0 ? (
                  <div className="space-y-4">
                    {couponHistory.map((transaction) => {
                      // Extract coupon code from description
                      const codeMatch = transaction.description.match(/: ([A-Z0-9]+)$/)
                      const couponCode = codeMatch ? codeMatch[1] : "Unknown"

                      return (
                        <div key={transaction.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">{couponCode}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.date).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">{formatCurrency(transaction.amount)}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                navigator.clipboard.writeText(couponCode)
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              }}
                            >
                              {copied ? "Copied!" : "Copy Code"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">You haven't generated any coupon codes yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-primary" />
            How Coupon Codes Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
            <div>
              <h3 className="font-semibold">Generate a Coupon Code</h3>
              <p className="text-sm text-muted-foreground">Create your unique coupon code to share with others</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
            <div>
              <h3 className="font-semibold">They Use Your Code</h3>
              <p className="text-sm text-muted-foreground">
                When someone signs up using your coupon code, they get ₦5,000
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
            <div>
              <h3 className="font-semibold">You Earn Rewards</h3>
              <p className="text-sm text-muted-foreground">Earn ₦500 for each person who uses your coupon code</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

