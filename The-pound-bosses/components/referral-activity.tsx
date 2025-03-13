"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, UserPlus, TrendingUp, Award, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { listenToReferrals, listenToGlobalReferrals } from "@/lib/referral-service"
import { formatCurrency } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ReferralActivity() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [referralData, setReferralData] = useState({
    referrals: 0,
    activeReferrals: 0,
    referralEarnings: 0,
    referredUsers: [],
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [newReferral, setNewReferral] = useState<any>(null)

  useEffect(() => {
    if (!user?.uid) return

    // Listen to user's referral data
    const unsubscribeReferrals = listenToReferrals(user.uid, (data) => {
      // Check if there's a new referral by comparing the count
      if (data.referrals > referralData.referrals && referralData.referrals > 0) {
        // Find the new referral (the one that wasn't in the previous list)
        const newReferredUsers = data.referredUsers || []
        const oldReferredUsers = referralData.referredUsers || []

        if (newReferredUsers.length > oldReferredUsers.length) {
          const latestReferral = newReferredUsers[newReferredUsers.length - 1]
          setNewReferral(latestReferral)
          setShowNotification(true)

          // Hide notification after 5 seconds
          setTimeout(() => {
            setShowNotification(false)
          }, 5000)
        }
      }

      setReferralData(data)
    })

    // Listen to global referral activity
    const unsubscribeActivity = listenToGlobalReferrals((data) => {
      setRecentActivity(data.recentReferrals || [])
      setLoading(false)
    })

    return () => {
      unsubscribeReferrals()
      unsubscribeActivity()
    }
  }, [user, referralData.referrals])

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Get random color for avatar
  const getAvatarColor = (name: string) => {
    if (!name) return "bg-primary"
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ]
    const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  return (
    <div className="space-y-6">
      {/* New Referral Notification */}
      <AnimatePresence>
        {showNotification && newReferral && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 w-80 rounded-lg bg-green-500 p-4 text-white shadow-lg"
          >
            <div className="flex items-start">
              <Bell className="mr-2 h-5 w-5" />
              <div>
                <h3 className="font-bold">New Referral!</h3>
                <p className="text-sm">
                  You just earned {formatCurrency(newReferral.reward)} from a new referral: {newReferral.username}!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Users className="mr-2 h-6 w-6 text-primary" />
            Referral Activity
          </CardTitle>
          <CardDescription className="text-base">
            Track your referrals and see recent activity across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="your-stats">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="your-stats">Your Stats</TabsTrigger>
              <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="your-stats" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="mr-2 h-5 w-5 text-primary" />
                      <div className="text-2xl font-bold">{referralData.referrals}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserPlus className="mr-2 h-5 w-5 text-green-500" />
                      <div className="text-2xl font-bold text-green-600">{referralData.activeReferrals}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Referral Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(referralData.referralEarnings)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6">
                <h3 className="mb-4 text-lg font-semibold">Your Referred Users</h3>
                {referralData.referredUsers && referralData.referredUsers.length > 0 ? (
                  <div className="space-y-3">
                    {referralData.referredUsers.slice(0, 5).map((referredUser: any, index: number) => (
                      <motion.div
                        key={referredUser.userId || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center">
                          <Avatar
                            className={`h-10 w-10 ${getAvatarColor(referredUser.username || referredUser.userId)}`}
                          >
                            <AvatarFallback>{getInitials(referredUser.username || referredUser.userId)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="font-medium">
                              {referredUser.username || `User ${referredUser.userId.substring(0, 6)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(referredUser.date).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          +{formatCurrency(referredUser.reward)}
                        </Badge>
                      </motion.div>
                    ))}

                    {referralData.referredUsers.length > 5 && (
                      <Button variant="outline" className="mt-2 w-full">
                        View All {referralData.referredUsers.length} Referrals
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No referrals yet</h3>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Share your referral link or coupon code to start earning rewards
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/referrals">Go to Referrals</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="recent-activity" className="space-y-4 pt-4">
              <div className="rounded-lg border p-4">
                <h3 className="mb-4 flex items-center text-lg font-semibold">
                  <Award className="mr-2 h-5 w-5 text-primary" />
                  Platform Activity
                </h3>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex animate-pulse items-center space-x-4 rounded-lg border p-3">
                        <div className="h-10 w-10 rounded-full bg-muted"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-muted"></div>
                          <div className="h-3 w-24 rounded bg-muted"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center">
                          <Avatar className={`h-10 w-10 ${getAvatarColor(activity.referrer)}`}>
                            <AvatarFallback>{getInitials(activity.referrer)}</AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <p className="font-medium">
                              <span className="text-primary">{activity.referrer}</span>
                              {activity.referrerLevel && (
                                <span className="ml-1 text-xs text-muted-foreground">({activity.referrerLevel})</span>
                              )}
                              <span> referred </span>
                              <span className="text-primary">{activity.referred}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          New Referral
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
                    <Users className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No recent activity</h3>
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      Be the first to refer someone and appear here!
                    </p>
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Leaderboard</CardTitle>
                  <CardDescription>Top referrers on the platform this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loading
                      ? Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <div
                              key={i}
                              className="flex animate-pulse items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-full bg-muted"></div>
                                <div className="space-y-2">
                                  <div className="h-4 w-24 rounded bg-muted"></div>
                                  <div className="h-3 w-16 rounded bg-muted"></div>
                                </div>
                              </div>
                              <div className="h-6 w-20 rounded bg-muted"></div>
                            </div>
                          ))
                      : // Group by referrer and count referrals
                        Object.entries(
                          recentActivity.reduce((acc, curr) => {
                            if (!acc[curr.referrer]) {
                              acc[curr.referrer] = {
                                count: 0,
                                level: curr.referrerLevel || "Unknown",
                              }
                            }
                            acc[curr.referrer].count++
                            return acc
                          }, {}),
                        )
                          .sort((a, b) => b[1].count - a[1].count)
                          .slice(0, 5)
                          .map(([username, data], index) => (
                            <div
                              key={username}
                              className={`flex items-center justify-between rounded-lg border p-3 ${
                                index === 0 ? "bg-yellow-500/10 border-yellow-500/30" : ""
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                  {index + 1}
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium">{username}</p>
                                  <p className="text-xs text-muted-foreground">{data.level}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-primary/10">
                                {data.count} referrals
                              </Badge>
                            </div>
                          ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

