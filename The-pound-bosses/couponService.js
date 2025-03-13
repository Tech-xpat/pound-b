import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

// Set environment variables directly in the script
const firebaseConfig = {
  projectId: "pounds-bosses-ng",
  clientEmail: "firebase-adminsdk-fbsvc@pounds-bosses-ng.iam.gserviceaccount.com",
  privateKey:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWHPc9cjBPuAtC\nfvR32VkCNDGAcQI18PXJ5YISh1LoOyzpLPfajNQattKacf+jOjS0LAJvGEGq6xZo\nFk/V4J821I8TQua8wmFy0erVyUftU9TxuumsZ77eR3aesKgWhFgq6DTOWKtGiwof\nyzbgdeFfSBia+VqdB6Fc1SW3rTIXTHpAq7l5EawSOBuThCwedfVXT0fWuxpnDT/0\nwb4G9Kbm1URBzZZpR/l7nAfLJMU1Qf3HwzFTDpOTAChEfCwSclL2TWgg8BblRTWh\n3NoOznPGKi6MN0UPW3aURLCbNW17jGrR5xHBAuGHtJF+4estidqohYWPQL0E386A\nXCx/h0trAgMBAAECggEAFSwTFKvkdBWWY3JrWSiQYSPpGzLRjaTwoRDFTnC8NYOY\nesw8DAvt82BNrgEEzs60JHbPnM2wvKZ3dj5ykYsfI0xcg4KTj2nHOhPg3VgEeUbX\nYTni3m351UAKzkFYtbVLhJ6mjhr9gMHB9AfjusldSk82Q6jRmYKGJchb7PA+6key\n0aCAcOxhd/fkPKgqOyJDnr9eiXsJMEqhphdRJ+9KwU3b2W68ve9NKLyDHQ8u3gPo\n8QclgIMbZKY/8qxWH2CtbueJHdcNuPqdGzGcUs3jes8c1WkgCz4LHs8OPpilNxFn\n73HY/Ytd1WIT4dM+dtNvKft8QVYKDDOd+1GdbNwTSQKBgQD43TT/ZOwGCOmMLJ88\nDAlvsL/2sK/Y8eSvepsBlFnxe0C25broLeBHztdIqLzO/FZUQKqyzPzwnW+O9p6M\n8MifRM0tn5TNNFE1N9gqaA/VeEg966oTdewSFFShyfONhaDDLqSiJfL+MVp8xEkO\n9VKbq1AdVTivAW7RZm0tdk5/CQKBgQDcQKsqIdyXgVKpDqr9um5PNwDgkhUGqgBA\n9+QfxLGh+xxCVOtjSa8IcSbMnzRal4oSSt6kBpF48AJOA6XZ7GadA+zmmwbjD5HQ\nMDyF626iEagK4EWOfwYaOE/Fl6V4PJtJHNbF01cEqwfEByEidBEqWh0zu+0E+jsK\nOAf46f6f0wKBgHmoeg4YIiHZHYL/FWDfaYWGXHGWcoCVz/vQ7hHZmhao8Dv5FmQG\neUvhW/ETPCnbxcAuVMRP3Z8q96xl96Bi3VCu67bP+ohOeRyRDkW81XC/+mD64gvd\na+hys+TbuwqGNs7z8FusPZvyOJAhzK1ZVGbxWprcXHeBNdF8RwcgfMMxAoGBANfp\nGSHbQfjPUK3jcCH8wSgsXlLHQY9f1ZHasCmoUw3cMQ6hWoLhd5FKAuPyaYspJLPb\n6zdWLQMmHMxHbS0dPlZLw88oR+8Mkz9IGfyaF8EOl/HZerY+tUe8zg6AIzikCQH6\nIFybWaF828cByiyRJUakQh416hrIBlp1JPOQxwf7AoGAZ2l3XHkfckxfYb3PeUQv\ngpYqb7CmbvRzkVyNj2Z8bTemy+HCc80jC+QoO7DL5EoHRUfRHWII+jab2ZkBIQZT\nNkfa/D6ftcoe1Ivj6K66xTLdcvdoAKWiW/vlvnjlvbOsYyFZ3Th7pD7h41gw2t3P\nKlGpmdNQztQBgi9hoBtL6wA=\n-----END PRIVATE KEY-----\n",
}

// Log configuration (excluding sensitive information)
console.log("Project ID:", firebaseConfig.projectId)
console.log("Client Email:", firebaseConfig.clientEmail)
console.log(
  "Private Key:",
  firebaseConfig.privateKey ? "Set (length: " + firebaseConfig.privateKey.length + ")" : "Not set",
)

// Initialize Firebase Admin
let db
try {
  const app = initializeApp({
    credential: cert(firebaseConfig),
  })
  db = getFirestore(app)
  console.log("Firebase initialized successfully")
} catch (error) {
  console.error("Error initializing Firebase:", error)
  throw error
}

// Function to generate a random coupon code
function generateCouponCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let coupon = ""
  for (let i = 0; i < length; i++) {
    coupon += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return coupon
}

// Function to generate a batch of coupons and save them to Firestore
async function generateBatchCoupons(numCoupons) {
  console.log(`Generating ${numCoupons} coupons...`)
  const batch = db.batch()
  const generatedCoupons = []
  for (let i = 0; i < numCoupons; i++) {
    const couponCode = generateCouponCode()
    const couponRef = db.collection("coupons").doc(couponCode)
    batch.set(couponRef, {
      code: couponCode,
      createdAt: new Date(),
      redeemed: false,
      redeemedAt: null,
    })
    generatedCoupons.push(couponCode)
    console.log(`Coupon generated: ${couponCode}`)
  }
  try {
    await batch.commit()
    console.log(`Successfully generated ${numCoupons} coupons.`)
    return generatedCoupons
  } catch (error) {
    console.error("Error committing batch:", error)
    throw error
  }
}

// Verify Firestore connection
async function verifyFirestoreConnection() {
  try {
    const snapshot = await db.collection("coupons").limit(1).get()
    console.log("Successfully connected to Firestore and retrieved data.")
    return true
  } catch (error) {
    console.error("Error connecting to Firestore:", error)
    return false
  }
}

// Main function to run the coupon generation
async function main() {
  try {
    const isConnected = await verifyFirestoreConnection()
    if (!isConnected) {
      throw new Error("Failed to connect to Firestore. Please check your configuration and network connection.")
    }

    const coupons = await generateBatchCoupons(70)
    console.log("Generated coupons:", coupons)
    console.log("Coupons have been successfully added to Firestore.")
  } catch (error) {
    console.error("Error in main function:", error)
  }
}

// Run the main function
main()

