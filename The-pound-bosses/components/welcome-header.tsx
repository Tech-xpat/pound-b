"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function WelcomeHeader() {
  const { user } = useAuth()
  const [username, setUsername] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUsername(data.username || "")

          // Check if user is new (registered less than 24 hours ago)
          const createdAt = new Date(data.createdAt)
          const now = new Date()
          const diffHours = Math.abs(now.getTime() - createdAt.getTime()) / 36e5
          setIsNewUser(diffHours < 24)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [user])

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold tracking-tight">
        {isNewUser ? "Welcome" : "Welcome back"}, {username}
      </h1>
      <p className="text-muted-foreground">
        {isNewUser
          ? "Thank you for joining Pounds Bosses. Let's get started with your journey!"
          : "Here's an overview of your referral performance"}
      </p>
    </motion.div>
  )
}

