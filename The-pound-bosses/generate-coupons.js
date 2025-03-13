import { generateBatchCoupons } from "./couponService.js"

async function main() {
  try {
    const coupons = await generateBatchCoupons(70)
    console.log("Generated coupons:", coupons)
    console.log("Coupons have been successfully added to Firestore.")
  } catch (error) {
    console.error("Error generating coupons:", error)
  }
}

main()

