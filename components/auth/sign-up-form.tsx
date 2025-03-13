"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/router"
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [otp, setOtp] = useState("")
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await sendEmailVerification(user)
      setVerificationSent(true)

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        balance: 0,
        bonusBalance: 0,
        referralCode: generateReferralCode(),
        referredBy: null, // This should be set if the user was referred
      })
    } catch (error) {
      console.error("Error during sign up:", error)
      setError("Failed to create an account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // In a real implementation, you would verify the OTP with your backend
      // For this example, we'll just check if the OTP is not empty
      if (otp.trim() === "") {
        throw new Error("Please enter the verification code")
      }

      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // If verification is successful, redirect to the dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error during verification:", error)
      setError(error.message || "Failed to verify the code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  if (verificationSent) {
    return (
      <form onSubmit={handleVerification} className="space-y-4">
        <div>
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter the code sent to your email"
            required
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Verify Email
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign Up
      </Button>
    </form>
  )
}

