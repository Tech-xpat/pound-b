"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "firebase/auth"
import { auth } from "./firebase"
import { isAuthorizedAdmin } from "./admin-auth"

interface AdminContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  loading: true,
  isAdmin: false,
})

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user)

      if (user) {
        // Check if user is an authorized admin
        const adminStatus = await isAuthorizedAdmin(user.uid)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return <AdminContext.Provider value={{ user, loading, isAdmin }}>{children}</AdminContext.Provider>
}

export const useAdmin = () => useContext(AdminContext)

