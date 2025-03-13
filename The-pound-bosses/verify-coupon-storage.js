import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { getDatabase, ref, get } from "firebase/database"

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

async function readCouponsFromRealtimeDB() {
  console.log("Reading coupons from Realtime Database:")
  const couponsRef = ref(rtdb, "coupons")
  const snapshot = await get(couponsRef)
  if (snapshot.exists()) {
    console.log(snapshot.val())
  } else {
    console.log("No data available in Realtime Database")
  }
}

async function readCouponsFromFirestore() {
  console.log("Reading coupons from Firestore:")
  const couponsCollection = collection(firestore, "coupons")
  const snapshot = await getDocs(couponsCollection)
  if (!snapshot.empty) {
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data())
    })
  } else {
    console.log("No data available in Firestore")
  }
}

async function main() {
  await readCouponsFromRealtimeDB()
  console.log("\n")
  await readCouponsFromFirestore()
}

main().catch(console.error)

