"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { logAdminAction } from "@/lib/admin-auth"
import { useAdmin } from "@/lib/admin-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search, MoreHorizontal, CheckCircle, XCircle, AlertCircle, Loader2, Eye, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminWithdrawalsPanel() {
  const { user } = useAdmin()
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")

  const fetchWithdrawals = async (status = "pending", searchTerm = "", startAfterDoc = null) => {
    try {
      setLoading(true)

      let withdrawalsQuery

      if (searchTerm) {
        // Search by user ID
        withdrawalsQuery = query(
          collection(db, "withdrawals"),
          where("userId", "==", searchTerm),
          where("status", "==", status),
          orderBy("timestamp", "desc"),
          limit(10),
        )
      } else {
        // Get withdrawals by status with pagination
        withdrawalsQuery = startAfterDoc
          ? query(
              collection(db, "withdrawals"),
              where("status", "==", status),
              orderBy("timestamp", "desc"),
              startAfter(startAfterDoc),
              limit(10),
            )
          : query(collection(db, "withdrawals"), where("status", "==", status), orderBy("timestamp", "desc"), limit(10))
      }

      const withdrawalsSnapshot = await getDocs(withdrawalsQuery)

      if (withdrawalsSnapshot.empty) {
        if (!startAfterDoc) {
          setWithdrawals([])
        }
        setHasMore(false)
      } else {
        const lastDoc = withdrawalsSnapshot.docs[withdrawalsSnapshot.docs.length - 1]
        setLastVisible(lastDoc)

        // Fetch user details for each withdrawal
        const fetchedWithdrawals = await Promise.all(
          withdrawalsSnapshot.docs.map(async (doc) => {
            const withdrawalData = doc.data()

            // Get user details
            let userData = { username: "Unknown" }
            try {
              const userDoc = await getDoc(doc(db, "users", withdrawalData.userId))
              if (userDoc.exists()) {
                userData = userDoc.data()
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
            }

            return {
              id: doc.id,
              ...withdrawalData,
              username: userData.username,
            }
          }),
        )

        if (startAfterDoc) {
          setWithdrawals((prevWithdrawals) => [...prevWithdrawals, ...fetchedWithdrawals])
        } else {
          setWithdrawals(fetchedWithdrawals)
        }

        setHasMore(withdrawalsSnapshot.docs.length === 10)
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      setError("Failed to load withdrawals. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals(activeTab)
  }, [activeTab])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawals([])
    setLastVisible(null)
    setHasMore(true)
    fetchWithdrawals(activeTab, searchQuery)
  }

  const loadMoreWithdrawals = () => {
    if (lastVisible) {
      fetchWithdrawals(activeTab, searchQuery, lastVisible)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setWithdrawals([])
    setLastVisible(null)
    setHasMore(true)
    setSearchQuery("")
  }

  const viewWithdrawalDetails = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal)
    setShowDetailsDialog(true)
  }

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!user) return

    setProcessingWithdrawal(true)

    try {
      const withdrawalRef = doc(db, "withdrawals", withdrawalId)

      // Get the withdrawal data
      const withdrawalDoc = await getDoc(withdrawalRef)
      if (!withdrawalDoc.exists()) {
        throw new Error("Withdrawal not found")
      }

      const withdrawalData = withdrawalDoc.data()

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: "completed",
        processedBy: user.uid,
        processedAt: new Date().toISOString(),
      })

      // Create transaction record
      const transactionData = {
        userId: withdrawalData.userId,
        amount: -withdrawalData.amount, // Negative amount for withdrawal
        type: "withdrawal",
        description: "Withdrawal processed",
        timestamp: new Date().toISOString(),
        reference: withdrawalId,
        adminId: user.uid,
        adminEmail: user.email,
      }

      // Add to transactions collection
      await setDoc(doc(db, "transactions", new Date().toISOString()), transactionData)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "approve_withdrawal", {
        withdrawalId,
        amount: withdrawalData.amount,
      })

      // Update local state
      setWithdrawals((prevWithdrawals) => prevWithdrawals.filter((w) => w.id !== withdrawalId))

      setShowDetailsDialog(false)
    } catch (error) {
      console.error("Error approving withdrawal:", error)
      setError("Failed to approve withdrawal. Please try again.")
    } finally {
      setProcessingWithdrawal(false)
    }
  }

  const openRejectDialog = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal)
    setRejectionReason("")
    setShowRejectDialog(true)
  }

  const handleRejectWithdrawal = async () => {
    if (!user || !selectedWithdrawal) return

    setProcessingWithdrawal(true)

    try {
      const withdrawalRef = doc(db, "withdrawals", selectedWithdrawal.id)

      // Get the withdrawal data
      const withdrawalDoc = await getDoc(withdrawalRef)
      if (!withdrawalDoc.exists()) {
        throw new Error("Withdrawal not found")
      }

      const withdrawalData = withdrawalDoc.data()

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: "rejected",
        rejectionReason: rejectionReason,
        processedBy: user.uid,
        processedAt: new Date().toISOString(),
      })

      // Refund the user's balance
      const userRef = doc(db, "users", withdrawalData.userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const currentEarnings = userData.earnings || 0

        await updateDoc(userRef, {
          earnings: currentEarnings + withdrawalData.amount,
        })
      }

      // Create transaction record for the refund
      const transactionData = {
        userId: withdrawalData.userId,
        amount: withdrawalData.amount,
        type: "withdrawal_refund",
        description: "Withdrawal rejected: " + rejectionReason,
        timestamp: new Date().toISOString(),
        reference: selectedWithdrawal.id,
        adminId: user.uid,
        adminEmail: user.email,
      }

      // Add to transactions collection
      await setDoc(doc(db, "transactions", new Date().toISOString()), transactionData)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "reject_withdrawal", {
        withdrawalId: selectedWithdrawal.id,
        amount: withdrawalData.amount,
        reason: rejectionReason,
      })

      // Update local state
      setWithdrawals((prevWithdrawals) => prevWithdrawals.filter((w) => w.id !== selectedWithdrawal.id))

      setShowRejectDialog(false)
      setShowDetailsDialog(false)
    } catch (error) {
      console.error("Error rejecting withdrawal:", error)
      setError("Failed to reject withdrawal. Please try again.")
    } finally {
      setProcessingWithdrawal(false)
    }
  }

  if (loading && withdrawals.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading withdrawals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Management</CardTitle>
          <CardDescription>Process withdrawal requests from users</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 mb-4">
            <Input
              type="search"
              placeholder="Search by user ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">{withdrawal.username}</TableCell>
                      <TableCell>{formatCurrency(withdrawal.amount)}</TableCell>
                      <TableCell>{withdrawal.bankName}</TableCell>
                      <TableCell>{withdrawal.accountNumber}</TableCell>
                      <TableCell>{formatDate(withdrawal.timestamp)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => viewWithdrawalDetails(withdrawal)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {activeTab === "pending" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRejectDialog(withdrawal)} className="text-red-600">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No {activeTab} withdrawals found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMoreWithdrawals} disabled={loading || !hasMore}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
            <DialogDescription>Review withdrawal request information</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Withdrawal ID:</div>
                <div className="truncate">{selectedWithdrawal.id}</div>

                <div className="font-medium">User:</div>
                <div>{selectedWithdrawal.username}</div>

                <div className="font-medium">User ID:</div>
                <div className="truncate">{selectedWithdrawal.userId}</div>

                <div className="font-medium">Amount:</div>
                <div>{formatCurrency(selectedWithdrawal.amount)}</div>

                <div className="font-medium">Bank:</div>
                <div>{selectedWithdrawal.bankName}</div>

                <div className="font-medium">Account Number:</div>
                <div>{selectedWithdrawal.accountNumber}</div>

                <div className="font-medium">Account Name:</div>
                <div>{selectedWithdrawal.accountName}</div>

                <div className="font-medium">Date Requested:</div>
                <div>{formatDate(selectedWithdrawal.timestamp)}</div>

                <div className="font-medium">Status:</div>
                <div>
                  {selectedWithdrawal.status === "pending" ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </span>
                  ) : selectedWithdrawal.status === "completed" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <XCircle className="mr-1 h-3 w-3" />
                      Rejected
                    </span>
                  )}
                </div>

                {selectedWithdrawal.processedAt && (
                  <>
                    <div className="font-medium">Processed Date:</div>
                    <div>{formatDate(selectedWithdrawal.processedAt)}</div>
                  </>
                )}

                {selectedWithdrawal.rejectionReason && (
                  <>
                    <div className="font-medium">Rejection Reason:</div>
                    <div>{selectedWithdrawal.rejectionReason}</div>
                  </>
                )}
              </div>

              {selectedWithdrawal.status === "pending" && (
                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => openRejectDialog(selectedWithdrawal)}
                    disabled={processingWithdrawal}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>

                  <Button
                    variant="default"
                    onClick={() => handleApproveWithdrawal(selectedWithdrawal.id)}
                    disabled={processingWithdrawal}
                  >
                    {processingWithdrawal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Withdrawal Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request. The amount will be refunded to the user's
              account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectWithdrawal}
              disabled={processingWithdrawal || !rejectionReason.trim()}
            >
              {processingWithdrawal ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

