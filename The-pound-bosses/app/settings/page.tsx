"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { User, Lock, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BottomNav } from "@/components/bottom-nav"
import { LogoutButton } from "@/components/logout-button"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [username, setUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      window.location.href = "/sign-in"
      return
    }

    const fetchUserData = async () => {
      setLoading(true)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData(data)
          setUsername(data.username || "")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, authLoading])

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setUpdating(true)

    if (!username.trim()) {
      setError("Username cannot be empty")
      setUpdating(false)
      return
    }

    try {
      // Update in Firebase Auth
      await updateProfile(user, {
        displayName: username,
      })

      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        username: username,
      })

      setSuccess("Username updated successfully")
    } catch (error) {
      console.error("Error updating username:", error)
      setError("Failed to update username")
    } finally {
      setUpdating(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setUpdating(true)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required")
      setUpdating(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      setUpdating(false)
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      setUpdating(false)
      return
    }

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)

      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Error changing password:", error)
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect")
      } else {
        setError("Failed to change password")
      }
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-bold text-xl">Pounds Bosses</div>
          <LogoutButton variant="ghost" size="sm" />
        </div>
      </header>

      <main className="flex-1">
        <div className="container py-4">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings</p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 space-y-6"
          >
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5 text-primary" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>Update your profile details</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleUpdateUsername}>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                        <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter your username"
                        />
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
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={updating}>
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
              <TabsContent value="security" className="space-y-4 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="mr-2 h-5 w-5 text-primary" />
                      Change Password
                    </CardTitle>
                    <CardDescription>Update your password</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleChangePassword}>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                        />
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
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={updating}>
                        {updating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Logout</CardTitle>
                    <CardDescription>Sign out of your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LogoutButton variant="destructive" />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

