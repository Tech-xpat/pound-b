import { initializeApp } from "firebase/app"
import { getDatabase, ref, set } from "firebase/database"
import { customAlphabet } from "nanoid"

const firebaseConfig = {
  apiKey: "AIzaSyAz9hb93DBOjO9mTHn9_-XaMYRuJA8tCbU",
  authDomain: "pounds-bosses.firebaseapp.com",
  projectId: "pounds-bosses",
  storageBucket: "pounds-bosses.firebasestorage.app",
  messagingSenderId: "15515739946",
  appId: "1:15515739946:web:a4c5df7d7c2da5b867a053",
  measurementId: "G-K85DM8JJW8",
  databaseURL: "https://pounds-bosses-default-rtdb.firebaseio.com",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

// Create a custom nanoid with only uppercase letters and numbers
const generateCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8)

async function generateCouponCodes(amount = 100) {
  const codes = []
  const promises = []

  for (let i = 0; i < amount; i++) {
    const code = generateCode()
    codes.push(code)

    // Prepare the coupon data
    const couponData = {
      code,
      created: new Date().toISOString(),
      used: false,
      expired: false,
    }

    // Write to Firebase Realtime Database
    const promise = set(ref(db, `coupons/${code}`), couponData)
    promises.push(promise)
  }

  // Wait for all writes to complete
  await Promise.all(promises)
  return codes
}

async function main() {
  console.log("Generating 100 new coupon codes...")
  const newCodes = await generateCouponCodes(100)
  console.log("New coupon codes generated and deposited to Firebase:")
  newCodes.forEach((code, index) => {
    console.log(`${index + 1}. ${code}`)
  })
}

main().catch(console.error)

