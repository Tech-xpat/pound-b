import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  increment,
  onSnapshot,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Process rewards when a user signs up with a coupon code
export async function processCouponReward(userId: string, couponCode: string) {
  try {
    // First, validate the coupon code
    const couponsRef = collection(db, "coupons")
    const couponQuery = query(couponsRef, where("code", "==", couponCode), where("used", "==", false))
    const couponSnapshot = await getDocs(couponQuery)

    if (couponSnapshot.empty) {
      return { success: false, error: "Invalid or already used coupon code" }
    }

    const couponDoc = couponSnapshot.docs[0]
    const couponData = couponDoc.data()

    // Get the referrer ID (creator of the coupon)
    const referrerId = couponData.createdBy

    if (!referrerId) {
      return { success: false, error: "Coupon has no associated referrer" }
    }

    // Mark coupon as used
    await updateDoc(doc(db, "coupons", couponDoc.id), {
      used: true,
      usedBy: userId,
      usedAt: Timestamp.now().toDate().toISOString(),
    })

    // Give new user ₦5,000 for using a coupon
    await addReward(userId, 5000, "Welcome bonus for using coupon code")

    // Give referrer ₦500 for their coupon being used
    await addReferrerReward(referrerId, 500, userId, "Reward for coupon code usage")

    // Update global referral stats
    await updateReferralStats(referrerId, userId)

    return { success: true }
  } catch (error) {
    console.error("Error processing coupon reward:", error)
    return { success: false, error: error.message }
  }
}

// Process rewards when a user signs up with a referral link
export async function processReferralLinkReward(userId: string, referrerId: string) {
  try {
    // No reward for the new user when using just a referral link

    // Give referrer ₦100 for their referral link being used (changed from 200 to 100)
    await addReferrerReward(referrerId, 100, userId, "Reward for referral link usage", true) // Added true for bonus

    // Update global referral stats
    await updateReferralStats(referrerId, userId)

    return { success: true }
  } catch (error) {
    console.error("Error processing referral link reward:", error)
    return { success: false, error: error.message }
  }
}

// Process rewards when a user signs up with both a referral link and a coupon
export async function processCombinedReward(userId: string, referrerId: string, couponCode: string) {
  try {
    // First, validate the coupon code
    const couponsRef = collection(db, "coupons")
    const couponQuery = query(couponsRef, where("code", "==", couponCode), where("used", "==", false))
    const couponSnapshot = await getDocs(couponQuery)

    if (couponSnapshot.empty) {
      return { success: false, error: "Invalid or already used coupon code" }
    }

    const couponDoc = couponSnapshot.docs[0]
    const couponData = couponDoc.data()

    // Get the coupon creator
    const couponCreatorId = couponData.createdBy

    // Mark coupon as used
    await updateDoc(doc(db, "coupons", couponDoc.id), {
      used: true,
      usedBy: userId,
      usedAt: Timestamp.now().toDate().toISOString(),
    })

    // Give new user ₦5,000 for using a coupon
    await addReward(userId, 5000, "Welcome bonus for using coupon code")

    // If the referrer is the same as the coupon creator
    if (referrerId === couponCreatorId) {
      // Give referrer ₦500 for coupon + ₦100 for referral link = ₦600
      await addReferrerReward(referrerId, 500, userId, "Reward for coupon code usage")
      await addReferrerReward(referrerId, 100, userId, "Reward for referral link usage", true) // Added as bonus
    } else {
      // Give coupon creator ₦500
      if (couponCreatorId) {
        await addReferrerReward(couponCreatorId, 500, userId, "Reward for coupon code usage")
      }

      // Give referral link owner ₦100
      await addReferrerReward(referrerId, 100, userId, "Reward for referral link usage", true) // Added as bonus
    }

    // Update global referral stats
    await updateReferralStats(referrerId, userId)
    if (couponCreatorId && couponCreatorId !== referrerId) {
      await updateReferralStats(couponCreatorId, userId)
    }

    return { success: true }
  } catch (error) {
    console.error("Error processing combined reward:", error)
    return { success: false, error: error.message }
  }
}

// Helper function to add rewards to a user
async function addReward(userId: string, amount: number, description: string) {
  const userRef = doc(db, "users", userId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error("User not found")
  }

  const userData = userDoc.data()

  // Create transaction record
  const transaction = {
    id: `reward-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: "deposit",
    amount,
    date: Timestamp.now().toDate().toISOString(),
    status: "completed",
    description,
  }

  // Update user document
  await updateDoc(userRef, {
    availableForWithdrawal: (userData.availableForWithdrawal || 0) + amount,
    totalEarnings: (userData.totalEarnings || 0) + amount,
    transactions: arrayUnion(transaction),
  })
}

// Helper function to add referrer rewards
async function addReferrerReward(
  referrerId: string,
  amount: number,
  referredUserId: string,
  description: string,
  isBonus = true, // Changed default to true
) {
  const userRef = doc(db, "users", referrerId)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) {
    throw new Error("Referrer not found")
  }

  const userData = userDoc.data()

  // Get referred user's username
  const referredUserDoc = await getDoc(doc(db, "users", referredUserId))
  let referredUsername = "Unknown User"
  if (referredUserDoc.exists()) {
    referredUsername = referredUserDoc.data().username || "Unknown User"
  }

  // Create transaction record
  const transaction = {
    id: `referrer-reward-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: "deposit",
    amount,
    date: Timestamp.now().toDate().toISOString(),
    status: "completed",
    description,
    referredUser: referredUserId,
    referredUsername: referredUsername,
    isBonus: isBonus,
  }

  // Update user document with increment to ensure atomic updates
  if (isBonus) {
    // Add to bonus balance
    await updateDoc(userRef, {
      bonusEarnings: increment(amount),
      totalEarnings: increment(amount),
      referralEarnings: increment(amount),
      referrals: increment(1),
      activeReferrals: increment(1),
      transactions: arrayUnion(transaction),
    })
  } else {
    // Add to available for withdrawal
    await updateDoc(userRef, {
      availableForWithdrawal: increment(amount),
      totalEarnings: increment(amount),
      referralEarnings: increment(amount),
      referrals: increment(1),
      activeReferrals: increment(1),
      transactions: arrayUnion(transaction),
    })
  }

  // Add this referred user to the referrer's referredUsers array
  await updateDoc(userRef, {
    referredUsers: arrayUnion({
      userId: referredUserId,
      username: referredUsername,
      date: Timestamp.now().toDate().toISOString(),
      reward: amount,
      isBonus: isBonus,
    }),
  })
}

// Update global referral statistics
async function updateReferralStats(referrerId: string, referredUserId: string) {
  try {
    // Get referrer's username
    const referrerDoc = await getDoc(doc(db, "users", referrerId))
    if (!referrerDoc.exists()) return

    const referrerUsername = referrerDoc.data().username
    const referrerLevel = calculateReferrerLevel(referrerDoc.data().referrals || 0)

    // Get referred user's username
    const referredUserDoc = await getDoc(doc(db, "users", referredUserId))
    if (!referredUserDoc.exists()) return

    const referredUsername = referredUserDoc.data().username

    // Add to global referral stats
    const statsRef = doc(db, "stats", "referrals")
    const statsDoc = await getDoc(statsRef)

    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        totalReferrals: increment(1),
        recentReferrals: arrayUnion({
          referrer: referrerUsername,
          referrerLevel: referrerLevel,
          referred: referredUsername,
          date: Timestamp.now().toDate().toISOString(),
        }),
      })
    } else {
      // Create stats document if it doesn't exist
      await setDoc(statsRef, {
        totalReferrals: 1,
        recentReferrals: [
          {
            referrer: referrerUsername,
            referrerLevel: referrerLevel,
            referred: referredUsername,
            date: Timestamp.now().toDate().toISOString(),
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error updating referral stats:", error)
  }
}

// Calculate referrer level based on number of referrals
function calculateReferrerLevel(referrals: number) {
  if (referrals === 0) return "Newbie"
  if (referrals >= 1 && referrals <= 5) return "Fire Starter"
  if (referrals >= 6 && referrals <= 10) return "Growing Legend"
  if (referrals >= 11 && referrals <= 19) return "Potential Admin"
  if (referrals >= 20 && referrals <= 30) return "Admin"
  if (referrals >= 31 && referrals <= 50) return "Leader"
  if (referrals >= 51 && referrals <= 100) return "Legend"
  return "Ultra Legend"
}

// Validate a coupon code
export async function validateCouponCode(couponCode: string) {
  try {
    const couponsRef = collection(db, "coupons")
    const couponQuery = query(couponsRef, where("code", "==", couponCode), where("used", "==", false))
    const couponSnapshot = await getDocs(couponQuery)

    if (couponSnapshot.empty) {
      return { valid: false, message: "Invalid or already used coupon code" }
    }

    return { valid: true, couponData: couponSnapshot.docs[0].data() }
  } catch (error) {
    console.error("Error validating coupon:", error)
    return { valid: false, message: "Error validating coupon" }
  }
}

// Set up a listener for referral events
export function listenToReferrals(userId: string, callback: (data: any) => void) {
  const userRef = doc(db, "users", userId)

  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data()
      callback({
        referrals: userData.referrals || 0,
        activeReferrals: userData.activeReferrals || 0,
        referralEarnings: userData.referralEarnings || 0,
        bonusEarnings: userData.bonusEarnings || 0,
        referredUsers: userData.referredUsers || [],
      })
    }
  })
}

// Get global referral activity
export function listenToGlobalReferrals(callback: (data: any) => void) {
  const statsRef = doc(db, "stats", "referrals")

  return onSnapshot(statsRef, (doc) => {
    if (doc.exists()) {
      const statsData = doc.data()
      callback({
        totalReferrals: statsData.totalReferrals || 0,
        recentReferrals: statsData.recentReferrals || [],
      })
    }
  })
}

