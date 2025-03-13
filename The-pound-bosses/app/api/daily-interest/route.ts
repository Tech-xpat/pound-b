import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    // Verify the request is authorized (you should implement proper auth)
    const { authorization } = request.headers

    // This should be a secure token verification in production
    if (authorization !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const interestRate = Number.parseFloat(process.env.NEXT_PUBLIC_DAILY_INTEREST_RATE || "4.0") / 100
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

        // Skip users with no funded amount
        if (!userData.totalFundedAmount || userData.totalFundedAmount <= 0) {
          continue
        }

        const interestAmount = userData.totalFundedAmount * interestRate

        // Create transaction record
        const transaction = {
          id: `interest-${Date.now()}-${userDoc.id.substring(0, 5)}`,
          type: "deposit",
          amount: interestAmount,
          date: Timestamp.now().toDate().toISOString(),
          status: "completed",
          description: `${interestRate * 100}% Daily interest on funded amount`,
        }

        // Update user document
        await updateDoc(doc(db, "users", userDoc.id), {
          availableForWithdrawal: (userData.availableForWithdrawal || 0) + interestAmount,
          totalEarnings: (userData.totalEarnings || 0) + interestAmount,
          transactions: arrayUnion(transaction),
        })

        results.processed++
        results.details.push({
          userId: userDoc.id,
          fundedAmount: userData.totalFundedAmount,
          interestAmount,
          success: true,
        })
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

    return NextResponse.json({
      success: true,
      message: `Daily interest processed for ${results.processed} users with ${results.errors} errors`,
      results,
    })
  } catch (error) {
    console.error("Error processing daily interest:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while processing daily interest",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

