# How to Get Your Flutterwave API Keys

To integrate Flutterwave payment processing into your Pounds Bosses platform, you'll need to obtain API keys from Flutterwave. Here's a step-by-step guide:

## Step 1: Create a Flutterwave Account

1. Visit [Flutterwave's website](https://flutterwave.com)
2. Click on "Sign Up" or "Create Account"
3. Fill in your details to create an account
4. Verify your email address

## Step 2: Complete Your Business Profile

1. Log in to your Flutterwave Dashboard
2. Complete your business profile with all required information
3. This is important for account verification and to access all features

## Step 3: Access Your API Keys

1. In your Flutterwave Dashboard, click on "Settings" in the sidebar
2. Select "API Keys & Webhooks"
3. You'll see both your Test and Live API keys:
   - **Public Key**: Used for client-side integration (safe to expose in frontend code)
   - **Secret Key**: Used for server-side verification (keep this secure, never expose in frontend code)
   - **Encryption Key**: Used for additional security

## Step 4: Set Up Environment Variables

Add these keys to your Vercel environment variables:

1. `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`: Your Flutterwave Public Key (can be used in frontend)
2. `FLUTTERWAVE_SECRET_KEY`: Your Flutterwave Secret Key (only use in server-side code)

## Test vs. Live Mode

- During development, use the Test API keys
- For production, switch to Live API keys
- Test mode allows you to simulate transactions without real money

## Account Verification API

For the bank account verification feature, you'll need to use Flutterwave's Account Verification API. This requires your Secret Key for authentication.

The endpoint is:

