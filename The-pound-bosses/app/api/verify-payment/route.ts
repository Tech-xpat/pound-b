import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { txRef, userId } = await request.json()

    if (!txRef || !userId) {
      return NextResponse.json({ success: false, message: "Missing required parameters" }, { status: 400 })
    }

    // Verify the transaction with Flutterwave
    const verificationResponse = await verifyFlutterwavePayment(txRef)

    if (verificationResponse.status === "success") {
      // Transaction is verified, update user's balance
      const transactionId = verificationResponse.data.id.toString()
      const amount = verificationResponse.data.amount

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        transactionId,
        amount,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed",
          details: verificationResponse.message,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while verifying the payment",
      },
      { status: 500 },
    )
  }
}

async function verifyFlutterwavePayment(txRef: string) {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY

  if (!secretKey) {
    throw new Error("Flutterwave secret key is not configured")
  }

  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error calling Flutterwave API:", error)
    throw error
  }
}

