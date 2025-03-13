import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { generateCouponCodes } from "./lib/coupon-generator.js"

const firebaseConfig = {
  apiKey: "AIzaSyAz9hb93DBOjO9mTHn9_-XaMYRuJA8tCbU",
  authDomain: "pounds-bosses.firebaseapp.com",
  projectId: "pounds-bosses",
  storageBucket: "pounds-bosses.firebasestorage.app",
  messagingSenderId: "15515739946",
  appId: "1:15515739946:web:a4c5df7d7c2da5b867a053",
  measurementId: "G-K85DM8JJW8",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  console.log("Generating 50 new coupon codes...")
  const newCodes = await generateCouponCodes(50)
  console.log("New coupon codes generated:")
  newCodes.forEach((code, index) => {
    console.log(`${index + 1}. ${code}`)
  })
}

main().catch(console.error)

