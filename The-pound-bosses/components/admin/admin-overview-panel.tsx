"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, CreditCard, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminOverviewPanel() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEarnings: 0,
    totalReferrals: 0,
    pendingWithdrawals: 0,
    recentSignups: [],
    recentTransactions: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)

        // Get users count
        const usersSnapshot = await getDocs(collection(db, "users"))
        const totalUsers = usersSnapshot.size

        // Get active users (logged in within last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const activeUsersQuery = query(collection(db, "users"), where("lastLogin", ">=", sevenDaysAgo.toISOString()))
        const activeUsersSnapshot = await getDocs(activeUsersQuery)
        const activeUsers = activeUsersSnapshot.size

        // Get total earnings and referrals
        let totalEarnings = 0
        let totalReferrals = 0
        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          if (userData.totalEarnings) {
            totalEarnings += userData.totalEarnings
          }
          if (userData.referrals) {
            totalReferrals += userData.referrals
          }
        })

        // Get pending withdrawals
        const pendingWithdrawalsQuery = query(collection(db, "withdrawals"), where("status", "==", "pending"))
        const pendingWithdrawalsSnapshot = await getDocs(pendingWithdrawalsQuery)
        let pendingWithdrawalsAmount = 0
        pendingWithdrawalsSnapshot.forEach((doc) => {
          const withdrawalData = doc.data()
          pendingWithdrawalsAmount += withdrawalData.amount
        })

        // Get recent signups
        const recentSignupsQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5))
        const recentSignupsSnapshot = await getDocs(recentSignupsQuery)
        const recentSignups = recentSignupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Get recent transactions
        const recentTransactionsQuery = query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(5))
        const recentTransactionsSnapshot = await getDocs(recentTransactionsQuery)
        const recentTransactions = recentTransactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setStats({
          totalUsers,
          activeUsers,
          totalEarnings,
          totalReferrals,
          pendingWithdrawals: pendingWithdrawalsAmount,
          recentSignups,
          recentTransactions,
        })
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError("Failed to load dashboard data. Please try refreshing the page.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active in the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Platform-wide earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">Platform-wide referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingWithdrawals)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Earnings</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 ? formatCurrency(stats.totalEarnings / stats.totalUsers) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per user</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>The latest users who joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentSignups.length > 0 ? (
              <div className="space-y-4">
                {stats.recentSignups.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent signups</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>The latest financial activities on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentTransactions.map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">{transaction.userId}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(transaction.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

