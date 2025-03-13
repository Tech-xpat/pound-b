"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAdmin } from "@/lib/admin-context"
import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  const { user, loading, isAdmin } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      // User is logged in but not an admin
      router.push("/")
    }
  }, [loading, user, isAdmin, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {!user ? (
        <AdminLoginForm />
      ) : isAdmin ? (
        <AdminDashboard />
      ) : (
        <div className="flex h-screen flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Unauthorized Access</h1>
          <p className="text-muted-foreground">You do not have permission to access this area.</p>
        </div>
      )}
    </div>
  )
}

