"use client"

import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, CreditCard } from "lucide-react"

import { DashboardView } from "@/components/dashboard-view"
import { BankingServices } from "@/components/banking-services"
import { BottomNav } from "@/components/bottom-nav"
import { LogoutButton } from "@/components/logout-button"
import { ReferralActivity } from "@/components/referral-activity"
import { EarnSection } from "@/components/earn-section"
import { FundAccountDialog } from "@/components/fund-account-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam || "overview")
  const [showFundDialog, setShowFundDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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

          // Check if user is new (registered less than 24 hours ago)
          const createdAt = new Date(data.createdAt)
          const now = new Date()
          const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / 36e5
          setIsNewUser(diffHours < 24)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user || !userData) {
    return null // Will redirect to sign-in page
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="font-bold text-2xl text-primary">Pounds Bosses</div>
            <div className="ml-4 hidden md:flex space-x-1">
              <Link
                href="/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "overview" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                Overview
              </Link>
              <Link
                href="/dashboard?tab=banking"
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "banking" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                Banking
              </Link>
              <Link
                href="/dashboard?tab=earn"
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "earn" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                Earn
              </Link>
              <Link
                href="/dashboard?tab=referrals"
                className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === "referrals" ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
              >
                Referrals
              </Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => setShowFundDialog(true)}>
                <Wallet className="mr-2 h-4 w-4" />
                Fund
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => setShowWithdrawDialog(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Withdraw
              </Button>
            </div>
            <div className="hidden md:block">
              <LogoutButton variant="outline" size="sm" />
            </div>
            <div className="flex items-center md:hidden">
              <span className="text-sm font-medium mr-2">{userData.username}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        <div className="container py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isNewUser ? "Welcome" : "Welcome back"}, {userData.username}
                </h1>
                <p className="text-muted-foreground">
                  {isNewUser
                    ? "Thank you for joining Pounds Bosses. Let's get started with your journey!"
                    : "Here's an overview of your account and earnings"}
                </p>
              </div>
              <div className="flex gap-2 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => setShowFundDialog(true)}
                >
                  <Wallet className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => setShowWithdrawDialog(true)}
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 md:hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="banking">Banking</TabsTrigger>
              <TabsTrigger value="earn">Earn</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <DashboardView />
            </TabsContent>

            <TabsContent value="banking" className="space-y-6">
              <BankingServices />
            </TabsContent>

            <TabsContent value="earn" className="space-y-6">
              <EarnSection />
            </TabsContent>

            <TabsContent value="referrals" className="space-y-6">
              <ReferralActivity />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />

      {/* Fund Account Dialog */}
      <FundAccountDialog open={showFundDialog} onOpenChange={setShowFundDialog} />

      {/* Withdraw Dialog */}
      <WithdrawDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog} />
    </div>
  )
}

