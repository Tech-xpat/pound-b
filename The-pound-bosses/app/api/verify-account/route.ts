import { NextResponse } from "next/server"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"

// Updated bank codes mapping for Interswitch
const BANK_CODE_MAPPING = {
  "ACCESS BANK": "044",
  "ZENITH BANK": "057",
  "FIRST BANK OF NIGERIA": "011",
  "UNITED BANK FOR AFRICA": "033",
  "GTBANK PLC": "058",
  ECOBANK: "050",
  "POLARIS BANK": "076",
  "STANBIC IBTC BANK": "221",
  "STERLING BANK": "232",
  "UNION BANK": "032",
  "FIDELITY BANK": "070",
  "KEYSTONE BANK": "082",
  "FIRST CITY MONUMENT BANK": "214",
  "WEMA BANK": "035",
  "HERITAGE BANK": "030",
  "JAIZ BANK": "301",
  "UNITY BANK": "215",
  "PROVIDUS BANK": "101",
  // Add more mappings as needed
}

export async function POST(request: Request) {
  try {
    const { account_number, account_bank } = await request.json()

    if (!account_number || !account_bank) {
      return NextResponse.json(
        { success: false, message: "Account number and bank code are required" },
        { status: 400 },
      )
    }

    // Use the mapped bank code if available, otherwise use the provided code
    const bankCode = BANK_CODE_MAPPING[account_bank.toUpperCase()] || account_bank

    // Log the request for debugging
    console.log(`Verifying account: ${account_number} with bank code: ${bankCode}`)

    try {
      // Interswitch API credentials - using the test credentials provided
      const clientId = process.env.INTERSWITCH_CLIENT_ID || "IKIA9614B82064D632E9B6418DF358A6A4AEA84D7218"
      const clientSecret = process.env.INTERSWITCH_CLIENT_SECRET || "XCTiBtLy1G9chAnyg0z3BcaFK4cVpwDg/GTw2EmjTZ8="
      const baseUrl = process.env.INTERSWITCH_BASE_URL || "https://sandbox.interswitchng.com"
      const terminalId = process.env.INTERSWITCH_TERMINAL_ID || "3DMO0001" // Using the test Terminal ID
      const entityCode = "DMO" // Initiating Entity Code from test data

      // Generate a unique request reference with the provided prefix
      const requestRef = `1453${uuidv4().replace(/-/g, "").substring(0, 12)}`

      // First, get access token
      const tokenResponse = await axios.post(`${baseUrl}/passport/oauth/token`, "grant_type=client_credentials", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
      })

      const accessToken = tokenResponse.data.access_token

      // Now use the token to validate the account
      // Using the name enquiry endpoint from the documentation
      const response = await axios.get(`${baseUrl}/api/v2/nameenquiry/banks/accounts/names/query`, {
        params: {
          bankCode: bankCode,
          accountId: account_number,
          requestReference: requestRef,
          entityCode: entityCode,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "terminal-id": terminalId,
          "request-reference": requestRef,
        },
        timeout: 20000, // 20 second timeout
      })

      console.log("Interswitch API Response:", response.data)

      // Check if the response contains account name
      if (response.data && response.data.accountName) {
        // Return the account details from the API response
        return NextResponse.json({
          success: true,
          data: {
            account_name: response.data.accountName,
            account_number: account_number,
            bank_code: bankCode,
            bank_name: account_bank,
            // Additional fields if available in the response
            bvn: response.data.bvn || "",
            kyc_level: response.data.kycLevel || "",
            request_reference: requestRef,
          },
          message: "Account verified successfully",
        })
      } else if (response.data && response.data.responseCode && response.data.responseCode !== "00") {
        // Handle specific API error messages based on response code
        return NextResponse.json(
          {
            success: false,
            message: response.data.responseDescription || "Account verification failed",
            error: response.data,
          },
          { status: 400 },
        )
      } else if (response.data && response.data.error) {
        // Handle specific API error messages
        return NextResponse.json(
          {
            success: false,
            message: response.data.error.message || "Account verification failed",
            error: response.data.error,
          },
          { status: 400 },
        )
      } else {
        throw new Error("Account name not returned by the API")
      }
    } catch (apiError) {
      console.error("API Error:", apiError.response?.data || apiError.message)

      // Provide more detailed error information
      const errorMessage =
        apiError.response?.data?.responseDescription ||
        apiError.response?.data?.error?.message ||
        apiError.response?.data?.message ||
        "Failed to verify account with the banking API"

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          error: apiError.response?.data || apiError.message,
        },
        { status: apiError.response?.status || 500 },
      )
    }
  } catch (error) {
    console.error("Server Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while verifying the account",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

