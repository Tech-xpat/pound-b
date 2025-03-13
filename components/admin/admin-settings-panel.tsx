"use client"

import { useState, useEffect } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { logAdminAction } from "@/lib/admin-auth"
import { useAdmin } from "@/lib/admin-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Loader2, Save, RefreshCw, CheckCircle, Settings, DollarSign, Users, Lock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminSettingsPanel() {
  const { user } = useAdmin()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    referralBonusAmount: 0,
    minimumWithdrawalAmount: 0,
    dailyInterestRate: 0,
    registrationEnabled: true,
    withdrawalsEnabled: true,
    maintenanceMode: false,
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    requirePinForWithdrawals: true,
    requireEmailVerification: true,
    maxLoginAttempts: 5,
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true)

        // Fetch platform settings
        const platformSettingsDoc = await getDoc(doc(db, "settings", "platform"))
        if (platformSettingsDoc.exists()) {
          setPlatformSettings(platformSettingsDoc.data() as any)
        }

        // Fetch security settings
        const securitySettingsDoc = await getDoc(doc(db, "settings", "security"))
        if (securitySettingsDoc.exists()) {
          setSecuritySettings(securitySettingsDoc.data() as any)
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        setError("Failed to load settings. Please try refreshing the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSavePlatformSettings = async () => {
    if (!user) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Validate settings
      if (platformSettings.referralBonusAmount < 0) {
        throw new Error("Referral bonus amount cannot be negative")
      }

      if (platformSettings.minimumWithdrawalAmount < 0) {
        throw new Error("Minimum withdrawal amount cannot be negative")
      }

      if (platformSettings.dailyInterestRate < 0 || platformSettings.dailyInterestRate > 100) {
        throw new Error("Daily interest rate must be between 0 and 100")
      }

      // Update platform settings
      await setDoc(doc(db, "settings", "platform"), platformSettings)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "update_platform_settings", platformSettings)

      setSuccess("Platform settings saved successfully")
    } catch (error: any) {
      console.error("Error saving platform settings:", error)
      setError(error.message || "Failed to save platform settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSecuritySettings = async () => {
    if (!user) return

    setSaving(true)
    setError("")
    setSuccess("")

    try {
      // Validate settings
      if (securitySettings.maxLoginAttempts < 1) {
        throw new Error("Max login attempts must be at least 1")
      }

      // Update security settings
      await setDoc(doc(db, "settings", "security"), securitySettings)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "update_security_settings", securitySettings)

      setSuccess("Security settings saved successfully")
    } catch (error: any) {
      console.error("Error saving security settings:", error)
      setError(error.message || "Failed to save security settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="platform">
            <Settings className="mr-2 h-4 w-4" />
            Platform Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="mr-2 h-4 w-4" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure global platform settings that affect all users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="referralBonusAmount" className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    Referral Bonus Amount
                  </Label>
                  <Input
                    id="referralBonusAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={platformSettings.referralBonusAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        referralBonusAmount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">Amount awarded to users when they refer someone</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="minimumWithdrawalAmount" className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    Minimum Withdrawal Amount
                  </Label>
                  <Input
                    id="minimumWithdrawalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={platformSettings.minimumWithdrawalAmount}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        minimumWithdrawalAmount: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">Minimum amount users can withdraw</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dailyInterestRate" className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                    Daily Interest Rate (%)
                  </Label>
                  <Input
                    id="dailyInterestRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={platformSettings.dailyInterestRate}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        dailyInterestRate: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">Daily interest rate applied to user balances</p>
                </div>

                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="registrationEnabled" className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    Enable User Registration
                  </Label>
                  <Switch
                    id="registrationEnabled"
                    checked={platformSettings.registrationEnabled}
                    onCheckedChange={(checked) =>
                      setPlatformSettings({
                        ...platformSettings,
                        registrationEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="withdrawalsEnabled" className="flex items-center">
                    <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                    Enable Withdrawals
                  </Label>
                  <Switch
                    id="withdrawalsEnabled"
                    checked={platformSettings.withdrawalsEnabled}
                    onCheckedChange={(checked) =>
                      setPlatformSettings({
                        ...platformSettings,
                        withdrawalsEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="maintenanceMode" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    Maintenance Mode
                  </Label>
                  <Switch
                    id="maintenanceMode"
                    checked={platformSettings.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setPlatformSettings({
                        ...platformSettings,
                        maintenanceMode: checked,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePlatformSettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security settings for the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="space-y-4">
                <div className="flex items-center justify-between space-y-0">
                  <Label htmlFor="requirePinForWithdrawals" className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Require PIN for Withdrawals
                  </Label>
                  <Switch
                    id="requirePinForWithdrawals"
                    checked={securitySettings.requirePinForWithdrawals}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requirePinForWithdrawals: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-y-0 pt-2">
                  <Label htmlFor="requireEmailVerification" className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Require Email Verification
                  </Label>
                  <Switch
                    id="requireEmailVerification"
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSecuritySettings({
                        ...securitySettings,
                        requireEmailVerification: checked,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2 pt-2">
                  <Label htmlFor="maxLoginAttempts" className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Max Login Attempts
                  </Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="1"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        maxLoginAttempts: Number.parseInt(e.target.value) || 5,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of failed login attempts before account is temporarily locked
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSecuritySettings} disabled={saving} className="ml-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

