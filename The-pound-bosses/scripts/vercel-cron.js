// This file is for setting up a Vercel Cron Job
// Save this as /api/cron/daily-interest.js in your project

import { db } from "../../lib/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"

export default async function handler(req, res) {
  // Verify the request is authorized
  const { authorization } = req.headers

  if (authorization !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const interestRate = Number.parseFloat(process.env.NEXT_PUBLIC_DAILY_INTEREST_RATE || "3.53") / 100
    const usersCollection = collection(db, "users")
    const usersSnapshot = await getDocs(usersCollection)

    const results = {
      processed: 0,
      errors: 0,
      details: [],
    }

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data()

        // Process active investments
        if (userData.investments && userData.investments.length > 0) {
          const activeInvestments = userData.investments.filter((inv) => inv.status === "active")

          for (const investment of activeInvestments) {
            // Check if investment is still within duration
            const endDate = new Date(investment.endDate)
            const now = new Date()

            if (now <= endDate && investment.daysProcessed < investment.duration) {
              // Calculate daily interest
              const dailyInterest = investment.amount * (investment.returnRate / 100)

              // Create transaction record
              const transaction = {
                id: `interest-${Date.now()}-${userDoc.id.substring(0, 5)}-${investment.id}`,
                type: "interest",
                amount: dailyInterest,
                date: Timestamp.now().toDate().toISOString(),
                status: "completed",
                description: `${investment.returnRate}% Daily interest on ${investment.planName}`,
                investmentId: investment.id,
              }

              // Update investment
              investment.daysProcessed += 1
              investment.totalEarned += dailyInterest

              // Update user document
              await updateDoc(doc(db, "users", userDoc.id), {
                availableForWithdrawal: (userData.availableForWithdrawal || 0) + dailyInterest,
                totalEarnings: (userData.totalEarnings || 0) + dailyInterest,
                transactions: arrayUnion(transaction),
                investments: userData.investments, // Update the entire investments array
              })

              results.processed++
              results.details.push({
                userId: userDoc.id,
                investmentId: investment.id,
                dailyInterest,
                success: true,
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error processing interest for user ${userDoc.id}:`, error)
        results.errors++
        results.details.push({
          userId: userDoc.id,
          error: error.message,
          success: false,
        })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Daily interest processed for ${results.processed} investments with ${results.errors} errors`,
      results,
    })
  } catch (error) {
    console.error("Error processing daily interest:", error)
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing daily interest",
      error: error.message,
    })
  }
}

