"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Shield } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TransactionPin() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasPin, setHasPin] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmNewPin, setConfirmNewPin] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [updating, setUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [pinStrength, setPinStrength] = useState(0)
  const [pinCreationDate, setPinCreationDate] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.uid) return

    const checkPin = async () => {
      setLoading(true)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const hasExistingPin = !!userData.transactionPin
          setHasPin(hasExistingPin)
          setActiveTab(hasExistingPin ? "change" : "create")

          if (hasExistingPin && userData.pinCreatedAt) {
            setPinCreationDate(userData.pinCreatedAt)
          }
        }
      } catch (error) {
        console.error("Error checking transaction PIN:", error)
      } finally {
        setLoading(false)
      }
    }

    checkPin()
  }, [user])

  // Calculate PIN strength
  useEffect(() => {
    if (!pin) {
      setPinStrength(0)
      return
    }

    let strength = 0

    // Basic length check
    if (pin.length === 4) strength += 1

    // Check for sequential numbers (1234, 2345, etc.)
    const isSequential = /1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|0123|9012/.test(pin)
    if (!isSequential) strength += 1

    // Check for repeated digits (1111, 2222, etc.)
    const isRepeated = /(\d)\1{3}/.test(pin)
    if (!isRepeated) strength += 1

    // Check for common PINs (1234, 0000, 1111, etc.)
    const commonPins = ["1234", "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"]
    if (!commonPins.includes(pin)) strength += 1

    setPinStrength(strength)
  }, [pin])

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setUpdating(true)

    if (!pin || !confirmPin || !currentPassword) {
      setError("All fields are required")
      setUpdating(false)
      return
    }

    if (pin !== confirmPin) {
      setError("PINs do not match")
      setUpdating(false)
      return
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError("PIN must be 4 digits")
      setUpdating(false)
      return
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Hash the PIN (in a real app, use a proper hashing method)
      // For this example, we'll store it directly (not recommended in production)
      await updateDoc(doc(db, "users", user.uid), {
        transactionPin: pin,
        pinCreatedAt: new Date().toISOString(),
      })

      setSuccess("Transaction PIN created successfully")
      setHasPin(true)
      setActiveTab("change")
      setPin("")
      setConfirmPin("")
      setCurrentPassword("")
      setPinCreationDate(new Date().toISOString())
    } catch (error) {
      console.error("Error creating transaction PIN:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else {
        setError("Failed to create transaction PIN")
      }
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setUpdating(true)

    if (!currentPin || !newPin || !confirmNewPin || !currentPassword) {
      setError("All fields are required")
      setUpdating(false)
      return
    }

    if (newPin !== confirmNewPin) {
      setError("New PINs do not match")
      setUpdating(false)
      return
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setError("PIN must be 4 digits")
      setUpdating(false)
      return
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Verify current PIN
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        if (userData.transactionPin !== currentPin) {
          setError("Current PIN is incorrect")
          setUpdating(false)
          return
        }
      }

      // Update PIN
      await updateDoc(doc(db, "users", user.uid), {
        transactionPin: newPin,
        pinUpdatedAt: new Date().toISOString(),
      })

      setSuccess("Transaction PIN updated successfully")
      setCurrentPin("")
      setNewPin("")
      setConfirmNewPin("")
      setCurrentPassword("")
      setPinCreationDate(new Date().toISOString())
    } catch (error) {
      console.error("Error changing transaction PIN:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else {
        setError("Failed to change transaction PIN")
      }
    } finally {
      setUpdating(false)
    }
  }

  const renderPinStrengthIndicator = () => {
    const getStrengthLabel = () => {
      if (pinStrength === 0) return "Not set"
      if (pinStrength === 1) return "Weak"
      if (pinStrength === 2) return "Fair"
      if (pinStrength === 3) return "Good"
      return "Strong"
    }

    const getStrengthColor = () => {
      if (pinStrength === 0) return "bg-gray-200"
      if (pinStrength === 1) return "bg-red-500"
      if (pinStrength === 2) return "bg-yellow-500"
      if (pinStrength === 3) return "bg-blue-500"
      return "bg-green-500"
    }

    return (
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span>PIN Strength</span>
          <span
            className={`font-medium ${
              pinStrength === 1
                ? "text-red-500"
                : pinStrength === 2
                  ? "text-yellow-500"
                  : pinStrength === 3
                    ? "text-blue-500"
                    : pinStrength === 4
                      ? "text-green-500"
                      : ""
            }`}
          >
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div
            className={`h-1.5 rounded-full transition-all ${getStrengthColor()}`}
            style={{ width: `${(pinStrength / 4) * 100}%` }}
          ></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary" />
            Transaction PIN
          </CardTitle>
          <CardDescription>Set up a 4-digit PIN to secure your transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" disabled={hasPin}>
                Create PIN
              </TabsTrigger>
              <TabsTrigger value="change" disabled={!hasPin}>
                Change PIN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 pt-4">
              <form onSubmit={handleCreatePin}>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pin">New 4-Digit PIN</Label>
                    <div className="relative">
                      <Input
                        id="pin"
                        type={showPin ? "text" : "password"}
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 4) {
                            setPin(value)
                          }
                        }}
                        maxLength={4}
                        placeholder="Enter 4-digit PIN"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {pin && renderPinStrengthIndicator()}

                    {pinStrength === 1 && (
                      <p className="text-xs text-red-500">
                        This PIN is too weak. Consider using a less predictable combination.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPin">Confirm PIN</Label>
                    <div className="relative">
                      <Input
                        id="confirmPin"
                        type={showPin ? "text" : "password"}
                        value={confirmPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 4) {
                            setConfirmPin(value)
                          }
                        }}
                        maxLength={4}
                        placeholder="Confirm 4-digit PIN"
                        className={`pr-10 ${
                          confirmPin && pin !== confirmPin
                            ? "border-red-500"
                            : confirmPin && pin === confirmPin
                              ? "border-green-500"
                              : ""
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmPin && pin !== confirmPin && <p className="text-xs text-red-500">PINs do not match</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your password is required to verify your identity</p>
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

                  <Button type="submit" className="w-full" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating PIN...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Create PIN
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="change" className="space-y-4 pt-4">
              {pinCreationDate && (
                <Alert className="bg-blue-500/10 border-blue-500/50">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <AlertTitle>PIN Information</AlertTitle>
                  <AlertDescription>
                    Your PIN was last updated on{" "}
                    {new Date(pinCreationDate).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleChangePin}>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentPin">Current PIN</Label>
                    <div className="relative">
                      <Input
                        id="currentPin"
                        type={showPin ? "text" : "password"}
                        value={currentPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 4) {
                            setCurrentPin(value)
                          }
                        }}
                        maxLength={4}
                        placeholder="Enter current PIN"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPin">New 4-Digit PIN</Label>
                    <div className="relative">
                      <Input
                        id="newPin"
                        type={showPin ? "text" : "password"}
                        value={newPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 4) {
                            setNewPin(value)
                          }
                        }}
                        maxLength={4}
                        placeholder="Enter new 4-digit PIN"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmNewPin">Confirm New PIN</Label>
                    <div className="relative">
                      <Input
                        id="confirmNewPin"
                        type={showPin ? "text" : "password"}
                        value={confirmNewPin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "")
                          if (value.length <= 4) {
                            setConfirmNewPin(value)
                          }
                        }}
                        maxLength={4}
                        placeholder="Confirm new 4-digit PIN"
                        className={`pr-10 ${
                          confirmNewPin && newPin !== confirmNewPin
                            ? "border-red-500"
                            : confirmNewPin && newPin === confirmNewPin
                              ? "border-green-500"
                              : ""
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {confirmNewPin && newPin !== confirmNewPin && (
                      <p className="text-xs text-red-500">PINs do not match</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="changePasswordCurrent">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="changePasswordCurrent"
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your password is required to verify your identity</p>
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

                  <Button type="submit" className="w-full" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating PIN...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change PIN
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col border-t bg-muted/50 px-6 py-4 text-xs text-muted-foreground">
          <p>Your transaction PIN is used to authorize withdrawals and sensitive account changes.</p>
          <p className="mt-1">Keep your PIN confidential and never share it with anyone.</p>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

