import { auth, db, googleProvider } from "./firebase"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth"
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"

const COUPON_ENDPOINT = "https://pounds-bosses-ng-default-rtdb.firebaseio.com/redeem-coupon"

export async function signUpWithEmail(email: string, password: string, username: string, couponCode: string) {
  // Validate coupon code if provided
  if (couponCode) {
    const response = await fetch(COUPON_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couponCode }),
    })
    if (!response.ok) {
      const result = await response.json()
      throw new Error("Coupon validation failed: " + result.error)
    }
  }

  // Check if username is taken
  const isUsernameTaken = await checkUsername(username)
  if (isUsernameTaken) {
    throw new Error("Username already taken")
  }

  // Create user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)

  // Create user profile
  await setDoc(doc(db, "users", userCredential.user.uid), {
    username,
    email,
    referrals: 0,
    earnings: 0,
    adsRun: 0,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  })

  // Mark coupon as used if provided
  if (couponCode) {
    await markCouponAsUsed(couponCode, userCredential.user.uid)
  }

  return userCredential.user
}

export async function signInWithGoogle(requiredUsername?: string) {
  const result = await signInWithPopup(auth, googleProvider)

  // Check if this is a new user
  const userDoc = await getDoc(doc(db, "users", result.user.uid))

  if (!userDoc.exists()) {
    if (!requiredUsername) {
      throw new Error("Username required for new registration")
    }

    // Check if username is taken
    const isUsernameTaken = await checkUsername(requiredUsername)
    if (isUsernameTaken) {
      await signOut(auth)
      throw new Error("Username already taken")
    }

    // Create new user profile
    await setDoc(doc(db, "users", result.user.uid), {
      username: requiredUsername,
      email: result.user.email,
      referrals: 0,
      earnings: 0,
      adsRun: 0,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    })
  }

  return result.user
}

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password)

  // Update last login
  await setDoc(
    doc(db, "users", result.user.uid),
    {
      lastLogin: new Date().toISOString(),
    },
    { merge: true },
  )

  return result.user
}

async function checkUsername(username: string) {
  const usersRef = collection(db, "users")
  const q = query(usersRef, where("username", "==", username))
  const querySnapshot = await getDocs(q)
  return !querySnapshot.empty
}

async function validateCouponCode(code: string) {
  const codeRef = doc(db, "coupons", code)
  const codeDoc = await getDoc(codeRef)

  if (!codeDoc.exists()) return false

  const codeData = codeDoc.data()
  return !codeData.used && !codeData.expired
}

async function markCouponAsUsed(code: string, userId: string) {
  await setDoc(
    doc(db, "coupons", code),
    {
      used: true,
      usedBy: userId,
      usedAt: new Date().toISOString(),
    },
    { merge: true },
  )
}

