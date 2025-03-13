import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { getDatabase, ref, set } from "firebase/database"
import { customAlphabet } from "nanoid"

const firebaseConfig = {
  apiKey: "AIzaSyAz9hb93DBOjO9mTHn9_-XaMYRuJA8tCbU",
  authDomain: "pounds-bosses.firebaseapp.com",
  databaseURL: "https://pounds-bosses-default-rtdb.firebaseio.com",
  projectId: "pounds-bosses",
  storageBucket: "pounds-bosses.firebasestorage.app",
  messagingSenderId: "15515739946",
  appId: "1:15515739946:web:a4c5df7d7c2da5b867a053",
  measurementId: "G-K85DM8JJW8",
}

const app = initializeApp(firebaseConfig)
const firestore = getFirestore(app)
const rtdb = getDatabase(app)

const generateCode = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8)

async function generateCouponCodes(amount = 10) {
  const codes = []
  const promises = []

  for (let i = 0; i < amount; i++) {
    const code = generateCode()
    codes.push(code)

    const couponData = {
      code,
      created: new Date().toISOString(),
      used: false,
      expired: false,
    }

    // Write to Realtime Database
    promises.push(
      set(ref(rtdb, `coupons/${code}`), couponData)
        .then(() => console.log(`Coupon ${code} added to Realtime Database`))
        .catch((error) => console.error(`Error adding coupon ${code} to Realtime Database:`, error)),
    )

    // Write to Firestore
    promises.push(
      setDoc(doc(firestore, "coupons", code), couponData)
        .then(() => console.log(`Coupon ${code} added to Firestore`))
        .catch((error) => console.error(`Error adding coupon ${code} to Firestore:`, error)),
    )
  }

  await Promise.all(promises)
  return codes
}

async function main() {
  console.log("Generating 10 new coupon codes...")
  const newCodes = await generateCouponCodes(10)
  console.log("New coupon codes generated and attempted to deposit to Firebase:")
  newCodes.forEach((code, index) => {
    console.log(`${index + 1}. ${code}`)
  })
  console.log("\nPlease check both Realtime Database and Firestore in your Firebase Console.")
}

main().catch(console.error)

