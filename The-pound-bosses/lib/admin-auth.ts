import { auth, db } from "./firebase"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

// Authorized admin emails
const AUTHORIZED_ADMINS = ["letstalk2mishael@gmail.com", "empiredigitalsworldwide@gmail.com"]

export async function signInAdmin(email: string, password: string) {
  // Check if email is authorized
  if (!AUTHORIZED_ADMINS.includes(email.toLowerCase())) {
    throw new Error("Unauthorized access attempt")
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password)

    // Update last login
    await setDoc(
      doc(db, "adminUsers", result.user.uid),
      {
        email: result.user.email,
        lastLogin: new Date().toISOString(),
      },
      { merge: true },
    )

    // Log admin login for audit
    await setDoc(doc(db, "adminLogs", new Date().toISOString()), {
      action: "login",
      adminId: result.user.uid,
      adminEmail: result.user.email,
      timestamp: new Date().toISOString(),
      ipAddress: "client-side", // In a real app, you'd get this from the server
    })

    return result.user
  } catch (error) {
    console.error("Admin login error:", error)
    throw error
  }
}

export async function signOutAdmin() {
  try {
    // Get current user before signing out
    const currentUser = auth.currentUser

    if (currentUser) {
      // Log admin logout for audit
      await setDoc(doc(db, "adminLogs", new Date().toISOString()), {
        action: "logout",
        adminId: currentUser.uid,
        adminEmail: currentUser.email,
        timestamp: new Date().toISOString(),
      })
    }

    await signOut(auth)
  } catch (error) {
    console.error("Admin logout error:", error)
    throw error
  }
}

export async function isAuthorizedAdmin(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (!userDoc.exists()) {
      return false
    }

    const userData = userDoc.data()
    return AUTHORIZED_ADMINS.includes(userData.email.toLowerCase())
  } catch (error) {
    console.error("Admin authorization check error:", error)
    return false
  }
}

export function logAdminAction(adminId: string, adminEmail: string, action: string, details?: any) {
  return setDoc(doc(db, "adminLogs", new Date().toISOString()), {
    action,
    adminId,
    adminEmail,
    details,
    timestamp: new Date().toISOString(),
  })
}

