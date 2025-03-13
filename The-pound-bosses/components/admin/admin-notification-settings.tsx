"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdmin } from "@/lib/admin-context"

export function AdminNotificationSettings() {
  const { user } = useAdmin()
  const [notifyOnNewTask, setNotifyOnNewTask] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const settingsDoc = await getDoc(doc(db, "adminSettings", user.uid))
      if (settingsDoc.exists()) {
        const data = settingsDoc.data()
        setNotifyOnNewTask(data.notifyOnNewTask || false)
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error)
      setError("Failed to fetch notification settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!user) return
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await updateDoc(doc(db, "adminSettings", user.uid), {
        notifyOnNewTask,
      })
      setSuccess("Notification settings saved successfully")
    } catch (error) {
      console.error("Error saving notification settings:", error)
      setError("Failed to save notification settings")
    } finally {
      setSaving(false)
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
        <CardTitle>Notification Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="notify-new-task" checked={notifyOnNewTask} onCheckedChange={setNotifyOnNewTask} />
            <Label htmlFor="notify-new-task">Notify users on new task</Label>
          </div>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
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

