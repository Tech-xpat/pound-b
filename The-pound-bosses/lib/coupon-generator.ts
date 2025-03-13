import { db } from "./firebase"
import { doc, setDoc, collection, getDocs } from "firebase/firestore"
import { customAlphabet } from "nanoid"

// Create a custom nanoid with only uppercase letters and numbers
const generateCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8)

export async function generateCouponCodes(amount = 100) {
  const codes: string[] = []
  const batch = []

  for (let i = 0; i < amount; i++) {
    const code = generateCode()
    codes.push(code)

    // Prepare the coupon document
    batch.push(
      setDoc(doc(db, "coupons", code), {
        code,
        created: new Date().toISOString(),
        used: false,
        expired: false,
      }),
    )
  }

  // Execute all writes in parallel
  await Promise.all(batch)
  return codes
}

export async function listActiveCoupons() {
  const couponsRef = collection(db, "coupons")
  const snapshot = await getDocs(couponsRef)

  const coupons = []
  snapshot.forEach((doc) => {
    const data = doc.data()
    if (!data.used && !data.expired) {
      coupons.push(data)
    }
  })

  return coupons
}

