"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { doc, setDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import {
  processCouponReward,
  processReferralLinkReward,
  processCombinedReward,
  validateCouponCode,
} from "@/lib/referral-service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [couponCode, setCouponCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [couponValid, setCouponValid] = useState<boolean | null>(null)
  const [couponMessage, setCouponMessage] = useState("")
  const [error, setError] = useState("")
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [tempUserId, setTempUserId] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get("ref")

  useEffect(() => {
    // If there's a referral code in the URL, store it but don't pre-fill the coupon field
    // as they are different things
  }, [referralCode])

  const handleCouponValidation = async () => {
    if (!couponCode.trim()) {
      setCouponValid(null)
      setCouponMessage("")
      return
    }

    setValidatingCoupon(true)
    try {
      const result = await validateCouponCode(couponCode)
      setCouponValid(result.valid)
      setCouponMessage(result.message || (result.valid ? "Coupon code is valid" : "Invalid coupon code"))
    } catch (error) {
      setCouponValid(false)
      setCouponMessage("Error validating coupon")
    } finally {
      setValidatingCoupon(false)
    }
  }

  // Validate coupon when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (couponCode.trim()) {
        handleCouponValidation()
      }
    }, 500) // Debounce validation

    return () => clearTimeout(timer)
  }, [couponCode])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password || !confirmPassword || !username) {
      setError("All fields are required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    // If coupon code is provided, validate it first
    if (couponCode.trim()) {
      const validation = await validateCouponCode(couponCode)
      if (!validation.valid) {
        setError(validation.message || "Invalid coupon code")
        return
      }
    }

    setLoading(true)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Send email verification
      await sendEmailVerification(user)

      // Store user ID temporarily for verification step
      setTempUserId(user.uid)

      // Set verification sent state to show verification form
      setVerificationSent(true)
      setLoading(false)
    } catch (error) {
      console.error("Error signing up:", error)
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use")
      } else {
        setError("Failed to create account. Please try again.")
      }
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // In a real implementation, you would verify the OTP with Firebase
      // For now, we'll just proceed with account creation

      // Update profile with username
      await updateProfile(auth.currentUser, {
        displayName: username,
      })

      // Create user document in Firestore
      await setDoc(doc(db, "users", tempUserId), {
        email,
        username,
        createdAt: Timestamp.now().toDate().toISOString(),
        referrals: 0,
        activeReferrals: 0,
        pendingReferrals: 0,
        earnings: 0,
        referralEarnings: 0,
        availableForWithdrawal: 0,
        pendingEarnings: 0,
        totalEarnings: 0,
        adsRun: 0,
        totalFundedAmount: 0,
        transactions: [],
      })

      // Process rewards based on signup method
      if (couponCode && referralCode) {
        // Both coupon and referral link
        // First, find the referrer ID from the username
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("username", "==", referralCode))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const referrerId = querySnapshot.docs[0].id
          await processCombinedReward(tempUserId, referrerId, couponCode)
        } else {
          // If referrer not found, just process the coupon
          await processCouponReward(tempUserId, couponCode)
        }
      } else if (couponCode) {
        // Only coupon code
        await processCouponReward(tempUserId, couponCode)
      } else if (referralCode) {
        // Only referral link
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("username", "==", referralCode))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const referrerId = querySnapshot.docs[0].id
          await processReferralLinkReward(tempUserId, referrerId)
        }
      }

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error verifying account:", error)
      setError("Failed to verify account. Please try again.")
      setLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification code to {email}. Please check your inbox and enter the code below.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleVerification}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
              <div className="text-center text-sm">
                Didn't receive the code?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setVerificationSent(false)}>
                  Go back and try again
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details to create your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="couponCode" className="flex items-center justify-between">
                <span>Coupon Code</span>
                {validatingCoupon && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {couponValid === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                {couponValid === false && <AlertCircle className="h-4 w-4 text-red-500" />}
              </Label>
              <Input
                id="couponCode"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                disabled={loading}
                className={couponValid === true ? "border-green-500" : couponValid === false ? "border-red-500" : ""}
              />
              {couponMessage && (
                <p className={`text-xs ${couponValid ? "text-green-500" : "text-red-500"}`}>{couponMessage}</p>
              )}
              <p className="text-xs text-muted-foreground">Enter a valid coupon code to get ₦5,000 bonus</p>
            </div>

            {referralCode && (
              <Alert className="bg-blue-500/10 text-blue-600">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Referral Detected</AlertTitle>
                <AlertDescription>You were referred by: {referralCode}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-primary underline">
                Sign in
              </Link>
            </div>
            <div className="text-center text-sm">
              Forgot your password?{" "}
              <Link href="/reset-password" className="font-medium text-primary underline">
                Reset password
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

