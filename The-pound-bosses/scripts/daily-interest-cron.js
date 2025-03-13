// This script should be run daily via a cron job to calculate and add interest
// You can set up a cron job on your server or use a service like Vercel Cron

const fetch = require("node-fetch")

async function processDailyInterest() {
  try {
    const response = await fetch("https://your-vercel-app-url.com/api/daily-interest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.CRON_SECRET_KEY,
      },
    })

    const data = await response.json()
    console.log("Daily interest processing result:", data)

    if (!data.success) {
      console.error("Error processing daily interest:", data.message)
    }
  } catch (error) {
    console.error("Error calling daily interest API:", error)
  }
}

processDailyInterest()

