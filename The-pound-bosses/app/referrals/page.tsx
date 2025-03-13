"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Copy, Share2, CheckCircle, Zap } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BottomNav } from "@/components/bottom-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CouponGenerator } from "@/components/coupon-generator"
import { ReferralActivity } from "@/components/referral-activity"
import Link from "next/link"

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState("")
  const [referralLink, setReferralLink] = useState("")
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    earnings: 0,
  })
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("referral")

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
          setReferralCode(data.username || "")
          setReferralStats({
            totalReferrals: data.referrals || 0,
            activeReferrals: data.activeReferrals || 0,
            pendingReferrals: data.pendingReferrals || 0,
            earnings: data.referralEarnings || 0,
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user, authLoading])

  useEffect(() => {
    if (referralCode) {
      setReferralLink(`${window.location.origin}/sign-up?ref=${referralCode}`)
    }
  }, [referralCode])

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Pounds Bosses",
        text: "Turn your network into net worth with Pounds Bosses!",
        url: referralLink,
      })
    } else {
      copyToClipboard(referralLink)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="font-bold text-2xl text-primary">
              Pounds Bosses
            </Link>
            <div className="ml-4 hidden md:flex space-x-1">
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Dashboard
              </Link>
              <Link href="/referrals" className="px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary">
                Referrals
              </Link>
              <Link href="/dashboard?tab=banking" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Banking
              </Link>
              <Link href="/settings" className="px-3 py-2 text-sm font-medium rounded-md hover:bg-muted">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        <div className="container py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Referrals & Coupons</h1>
            <p className="text-muted-foreground">Invite friends and earn cash rewards</p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="referral">Referral Link</TabsTrigger>
              <TabsTrigger value="coupon">Coupon Codes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="referral" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
                  <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                      <Users className="mr-2 h-6 w-6 text-primary" />
                      Your Referral Link
                    </CardTitle>
                    <CardDescription className="text-base">
                      Share this link with friends to earn ₦200 per referral
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center space-x-2">
                        <Input value={referralLink} readOnly className="font-medium border-primary/20 bg-white" />
                        <Button
                          size="icon"
                          onClick={() => copyToClipboard(referralLink)}
                          variant="outline"
                          className="flex-shrink-0 border-primary/20 hover:bg-primary/10"
                        >
                          {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                      <Button
                        className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
                        onClick={shareReferralLink}
                      >
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Referral Link
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 border-primary/20 text-primary hover:bg-primary/10"
                        asChild
                      >
                        <Link
                          href={`sms:?body=Join Pounds Bosses and earn cash! Use my referral link: ${referralLink}`}
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Share via SMS
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-4 mt-6">
                  <Card className="bg-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{referralStats.activeReferrals}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-yellow-500/10 border-yellow-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{referralStats.pendingReferrals}</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">₦{referralStats.earnings.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6 border-primary/20">
                  <CardHeader>
                    <CardTitle>How Referral Links Work</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        1
                      </div>
                      <div>
                        <h3 className="font-semibold">Share Your Link</h3>
                        <p className="text-sm text-muted-foreground">
                          Share your unique referral link with friends and family
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        2
                      </div>
                      <div>
                        <h3 className="font-semibold">They Sign Up</h3>
                        <p className="text-sm text-muted-foreground">
                          When they sign up using your link, they become your referral
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        3
                      </div>
                      <div>
                        <h3 className="font-semibold">You Earn Rewards</h3>
                        <p className="text-sm text-muted-foreground">Earn ₦200 for each successful referral</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="coupon" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <CouponGenerator />
              </motion.div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <ReferralActivity />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

