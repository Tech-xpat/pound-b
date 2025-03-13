"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, AlertCircle, Trash2, Shield, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"

interface BankAccountValidatorProps {
  onValidation: (isValid: boolean, data: any) => void
  defaultBankName?: string
  defaultAccountNumber?: string
  defaultAccountName?: string
  savedAccounts?: BankAccount[]
  onDeleteAccount?: (account: BankAccount) => void
  userPin?: string
}

interface BankAccount {
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
  id?: string
}

interface ApiResponse {
  account_name: string
  account_number: string
  bank_code: string
  bank_name: string
  bvn?: string
  kyc_level?: string
  request_reference?: string
}

// Nigerian banks with their codes
const NIGERIAN_BANKS = [
  { name: "ACCESS BANK", code: "044" },
  { name: "ZENITH BANK", code: "057" },
  { name: "FIRST BANK OF NIGERIA", code: "011" },
  { name: "UNITED BANK FOR AFRICA", code: "033" },
  { name: "GTBANK PLC", code: "058" },
  { name: "ECOBANK", code: "050" },
  { name: "POLARIS BANK", code: "076" },
  { name: "STANBIC IBTC BANK", code: "221" },
  { name: "STERLING BANK", code: "232" },
  { name: "UNION BANK", code: "032" },
  { name: "FIDELITY BANK", code: "070" },
  { name: "KEYSTONE BANK", code: "082" },
  { name: "FIRST CITY MONUMENT BANK", code: "214" },
  { name: "WEMA BANK", code: "035" },
  { name: "HERITAGE BANK", code: "030" },
  { name: "JAIZ BANK", code: "301" },
  { name: "UNITY BANK", code: "215" },
  { name: "PROVIDUS BANK", code: "101" },
  { name: "TITAN TRUST BANK", code: "102" },
  { name: "GLOBUS BANK", code: "103" },
  { name: "SIGNATURE BANK", code: "000034" },
  { name: "OPTIMUS BANK", code: "000036" },
  { name: "CITI BANK", code: "023" },
  { name: "STANDARD CHARTERED BANK", code: "068" },
  { name: "SUNTRUST BANK", code: "100" },
  { name: "TAJ BANK", code: "302" },
  { name: "PARALLEX BANK", code: "104" },
  { name: "PREMIUM TRUST BANK", code: "105" },
  { name: "LOTUS BANK", code: "303" },
  { name: "KUDA MICROFINANCE BANK", code: "090267" },
  { name: "OPAY", code: "100004" },
  { name: "PALMPAY", code: "100033" },
  { name: "MONIEPOINT MICROFINANCE BANK", code: "090405" },
].sort((a, b) => a.name.localeCompare(b.name))

// Test accounts for easy access during development/testing
const TEST_ACCOUNTS = [
  { bank: "GTBANK PLC", code: "058", account: "0014261063", name: "Test Account GTB" },
  { bank: "UNITED BANK FOR AFRICA", code: "033", account: "9999999999", name: "Test Account UBA" },
]

export function BankAccountValidator({
  onValidation,
  defaultBankName = "",
  defaultAccountNumber = "",
  defaultAccountName = "",
  savedAccounts = [],
  onDeleteAccount,
  userPin = "",
}: BankAccountValidatorProps) {
  const [bankName, setBankName] = useState(defaultBankName)
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState(defaultAccountNumber)
  const [accountName, setAccountName] = useState(defaultAccountName)
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Delete account dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Update bank code when bank name changes
  useEffect(() => {
    if (bankName) {
      const selectedBank = NIGERIAN_BANKS.find((bank) => bank.name === bankName)
      if (selectedBank) {
        setBankCode(selectedBank.code)
      }
    }
  }, [bankName])

  // Validate account number format
  const isValidAccountNumber = (accNum: string) => {
    return /^\d{10}$/.test(accNum)
  }

  // Handle account number change
  const handleAccountNumberChange = (value: string) => {
    // Only allow digits and limit to 10 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 10)
    setAccountNumber(cleanValue)

    // Reset validation when account number changes
    if (validationStatus !== "idle") {
      setValidationStatus("idle")
    }
  }

  // Validate the form
  const validateForm = () => {
    if (!bankCode || !accountNumber) {
      setErrorMessage("Bank name and account number are required")
      setValidationStatus("invalid")
      return false
    }

    if (!isValidAccountNumber(accountNumber)) {
      setErrorMessage("Account number must be 10 digits")
      setValidationStatus("invalid")
      return false
    }

    if (!accountName.trim()) {
      setErrorMessage("Account name is required")
      setValidationStatus("invalid")
      return false
    }

    setValidationStatus("valid")
    return true
  }

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmDialog(true)
    }
  }

  // Confirm and submit the account details
  const confirmSubmit = () => {
    onValidation(true, {
      bankName,
      bankCode,
      accountNumber,
      accountName,
    })
    setShowConfirmDialog(false)
  }

  // Handle account deletion
  const handleDeleteAccount = (account: BankAccount) => {
    setAccountToDelete(account)
    setPinInput("")
    setPinError("")
    setDeleteDialogOpen(true)
  }

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return

    // Verify PIN
    if (pinInput !== userPin) {
      setPinError("Invalid PIN. Please try again.")
      return
    }

    setDeletingAccount(true)

    try {
      if (onDeleteAccount) {
        await onDeleteAccount(accountToDelete)
      }
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting account:", error)
      setPinError("Failed to delete account. Please try again.")
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Saved Accounts Section */}
      {savedAccounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Your Saved Accounts</h3>
          <div className="grid gap-3">
            {savedAccounts.map((account, index) => (
              <Card key={account.id || index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium">{account.bankName}</span>
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{account.accountName}</p>
                      <p className="text-sm">{account.accountNumber}</p>
                    </div>
                    {onDeleteAccount && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteAccount(account)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add New Account Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Bank Account</h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Select
              value={bankName}
              onValueChange={(value) => {
                setBankName(value)
                // Reset validation status when bank changes
                if (validationStatus !== "idle") {
                  setValidationStatus("idle")
                }
              }}
            >
              <SelectTrigger id="bankName" className={validationStatus === "valid" ? "border-green-500" : ""}>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_BANKS.map((bank) => (
                  <SelectItem key={bank.name} value={bank.name}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountNumber" className="flex items-center justify-between">
              <span>Account Number</span>
              {validationStatus === "valid" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {validationStatus === "invalid" && <AlertCircle className="h-4 w-4 text-red-500" />}
            </Label>
            <Input
              id="accountNumber"
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={(e) => handleAccountNumberChange(e.target.value)}
              maxLength={10}
              className={
                validationStatus === "valid"
                  ? "border-green-500"
                  : validationStatus === "invalid"
                    ? "border-red-500"
                    : ""
              }
            />
            {accountNumber.length === 10 && bankCode && validationStatus === "idle" && (
              <div className="text-xs text-blue-600 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Account number format is valid.
              </div>
            )}

            {accountNumber.length > 0 && accountNumber.length < 10 && (
              <p className="text-xs text-muted-foreground">{10 - accountNumber.length} more digits needed</p>
            )}
          </div>

          {/* Account Name Section - Manual entry */}
          <div className="grid gap-2">
            <Label htmlFor="accountName" className="flex items-center justify-between">
              <span>Account Name</span>
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Enter account holder's name"
              className={
                validationStatus === "valid"
                  ? "border-green-500"
                  : validationStatus === "invalid" && !accountName.trim()
                    ? "border-red-500"
                    : ""
              }
            />
            <p className="text-xs text-muted-foreground">
              Please enter the exact name as it appears on your bank account
            </p>
          </div>

          {validationStatus === "invalid" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSubmit} disabled={!bankCode || !accountNumber || !accountName.trim()} className="mt-2">
            <User className="mr-2 h-4 w-4" />
            Save Account Details
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Account Details</DialogTitle>
            <DialogDescription>
              Please verify that the following account details are correct. Incorrect details may lead to failed
              transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 font-medium text-amber-800">Important Notice</h4>
              <p className="text-sm text-amber-700">
                Please double-check that the account details below are accurate. Funds sent to incorrect accounts cannot
                be recovered.
              </p>
            </div>

            <div className="rounded-md border p-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span className="font-medium">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span className="font-medium">{accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Name:</span>
                  <span className="font-medium">{accountName}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Edit Details
            </Button>
            <Button onClick={confirmSubmit}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank Account</DialogTitle>
            <DialogDescription>
              You are about to delete the bank account {accountToDelete?.bankName} - {accountToDelete?.accountNumber}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="pin" className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                Enter Transaction PIN
              </Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter your 4-digit PIN"
                value={pinInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 4) {
                    setPinInput(value)
                    setPinError("")
                  }
                }}
                maxLength={4}
              />
              {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAccount}
              disabled={pinInput.length !== 4 || deletingAccount}
            >
              {deletingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

