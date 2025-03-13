"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Users, DollarSign, Target, Crown } from "lucide-react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { calculateLevel } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

import { Card } from "@/components/ui/card"
import { StatsCard } from "@/components/stats-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface UserStats {
  referrals: number
  earnings: number
  adsRun: number
  availableForWithdrawal: number
  pendingEarnings: number
  username: string
  isNewUser?: boolean
  usedCouponCode?: boolean
}

export function DashboardView() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    referrals: 0,
    earnings: 0,
    adsRun: 0,
    availableForWithdrawal: 0,
    pendingEarnings: 0,
    username: "",
    isNewUser: false,
    usedCouponCode: false,
  })

  useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data()

        // Check if user is new (registered less than 24 hours ago)
        const createdAt = new Date(data.createdAt || new Date())
        const now = new Date()
        const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / 36e5
        const isNewUser = diffHours < 24

        // Check if user has transactions that indicate they used a coupon code
        const transactions = data.transactions || []
        const usedCouponCode = transactions.some(
          (t) => t.description && t.description.includes("Welcome bonus for using coupon code"),
        )

        setStats({
          referrals: data.referrals || 0,
          earnings: data.earnings || 0,
          adsRun: data.adsRun || 0,
          availableForWithdrawal: data.availableForWithdrawal || 0,
          pendingEarnings: data.pendingEarnings || 0,
          username: data.username || "",
          isNewUser,
          usedCouponCode,
        })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const level = calculateLevel(stats.referrals)

  const statsData = [
    {
      title: "Total Referrals",
      value: stats.referrals.toString(),
      description: "Keep growing your network",
      icon: Users,
    },
    {
      title: "Cash Earned",
      value: `₦${stats.earnings.toLocaleString()}`,
      description: "Total earnings to date",
      icon: DollarSign,
    },
    {
      title: "Ads Run",
      value: stats.adsRun.toString(),
      description: "Total campaigns",
      icon: Target,
    },
    {
      title: "Level Achieved",
      value: level.title,
      description: "Keep climbing the ranks",
      icon: Crown,
      color: level.color,
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 pb-20">
      {stats.isNewUser && stats.usedCouponCode && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Alert className="bg-green-500/10 text-green-600 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Welcome Bonus!</AlertTitle>
            <AlertDescription>
              You've received ₦5,000 for signing up with a valid coupon code. Start earning more by referring others!
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              loading={loading}
              color={stat.color}
            />
          </motion.div>
        ))}
      </div>
      <Card className="p-4 mt-4">
        <div className="text-center p-4">
          <h3 className="text-lg font-bold mb-2">Weekly Summary</h3>
          <p className="text-sm text-muted-foreground">{loading ? "Loading..." : `Current Level: ${level.title}`}</p>
        </div>
      </Card>
    </div>
  )
}

