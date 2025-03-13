"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  RefreshCw,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminTransactionsPanel() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [transactionType, setTransactionType] = useState("all")

  const fetchTransactions = async (type = "all", searchTerm = "", startAfterDoc = null) => {
    try {
      setLoading(true)

      let transactionsQuery

      if (searchTerm) {
        // Search by user ID
        transactionsQuery = query(
          collection(db, "transactions"),
          where("userId", "==", searchTerm),
          orderBy("timestamp", "desc"),
          limit(20),
        )
      } else if (type !== "all") {
        // Filter by transaction type
        transactionsQuery = startAfterDoc
          ? query(
              collection(db, "transactions"),
              where("type", "==", type),
              orderBy("timestamp", "desc"),
              startAfter(startAfterDoc),
              limit(20),
            )
          : query(collection(db, "transactions"), where("type", "==", type), orderBy("timestamp", "desc"), limit(20))
      } else {
        // Get all transactions with pagination
        transactionsQuery = startAfterDoc
          ? query(collection(db, "transactions"), orderBy("timestamp", "desc"), startAfter(startAfterDoc), limit(20))
          : query(collection(db, "transactions"), orderBy("timestamp", "desc"), limit(20))
      }

      const transactionsSnapshot = await getDocs(transactionsQuery)

      if (transactionsSnapshot.empty) {
        if (!startAfterDoc) {
          setTransactions([])
        }
        setHasMore(false)
      } else {
        const lastDoc = transactionsSnapshot.docs[transactionsSnapshot.docs.length - 1]
        setLastVisible(lastDoc)

        // Fetch user details for each transaction
        const fetchedTransactions = await Promise.all(
          transactionsSnapshot.docs.map(async (doc) => {
            const transactionData = doc.data()

            // Get user details
            let username = "Unknown"
            try {
              if (transactionData.userId) {
                const userDoc = await getDoc(doc(db, "users", transactionData.userId))
                if (userDoc.exists()) {
                  username = userDoc.data().username
                }
              }
            } catch (error) {
              console.error("Error fetching user data:", error)
            }

            return {
              id: doc.id,
              ...transactionData,
              username,
            }
          }),
        )

        if (startAfterDoc) {
          setTransactions((prevTransactions) => [...prevTransactions, ...fetchedTransactions])
        } else {
          setTransactions(fetchedTransactions)
        }

        setHasMore(transactionsSnapshot.docs.length === 20)
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setError("Failed to load transactions. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions(transactionType)
  }, [transactionType])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setTransactions([])
    setLastVisible(null)
    setHasMore(true)
    fetchTransactions(transactionType, searchQuery)
  }

  const loadMoreTransactions = () => {
    if (lastVisible) {
      fetchTransactions(transactionType, searchQuery, lastVisible)
    }
  }

  const viewTransactionDetails = (transaction: any) => {
    setSelectedTransaction(transaction)
    setShowDetailsDialog(true)
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "deposit":
        return "Deposit"
      case "withdrawal":
        return "Withdrawal"
      case "withdrawal_refund":
        return "Withdrawal Refund"
      case "admin_credit":
        return "Admin Credit"
      case "referral_bonus":
        return "Referral Bonus"
      case "interest":
        return "Interest"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  const getTransactionIcon = (type: string, amount: number) => {
    if (amount > 0) {
      if (type === "admin_credit") {
        return <CreditCard className="h-4 w-4 text-green-500" />
      } else if (type === "referral_bonus") {
        return <RefreshCw className="h-4 w-4 text-green-500" />
      } else {
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      }
    } else {
      return <ArrowUpRight className="h-4 w-4 text-red-500" />
    }
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all financial transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex w-full items-center space-x-2">
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
            </div>

            <div>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="admin_credit">Admin Credits</SelectItem>
                  <SelectItem value="referral_bonus">Referral Bonuses</SelectItem>
                  <SelectItem value="interest">Interest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionIcon(transaction.type, transaction.amount)}
                          <span>{getTransactionTypeLabel(transaction.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.username}</TableCell>
                      <TableCell className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{transaction.description}</TableCell>
                      <TableCell>{formatDate(transaction.timestamp)}</TableCell>
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
                            <DropdownMenuItem onClick={() => viewTransactionDetails(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMoreTransactions} disabled={loading || !hasMore}>
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

      {/* Transaction Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>Detailed information about this transaction</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Transaction ID:</div>
                <div className="truncate">{selectedTransaction.id}</div>

                <div className="font-medium">Type:</div>
                <div>{getTransactionTypeLabel(selectedTransaction.type)}</div>

                <div className="font-medium">User:</div>
                <div>{selectedTransaction.username}</div>

                <div className="font-medium">User ID:</div>
                <div className="truncate">{selectedTransaction.userId}</div>

                <div className="font-medium">Amount:</div>
                <div className={selectedTransaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                  {formatCurrency(selectedTransaction.amount)}
                </div>

                <div className="font-medium">Description:</div>
                <div>{selectedTransaction.description}</div>

                <div className="font-medium">Date:</div>
                <div>{formatDate(selectedTransaction.timestamp)}</div>

                {selectedTransaction.reference && (
                  <>
                    <div className="font-medium">Reference:</div>
                    <div className="truncate">{selectedTransaction.reference}</div>
                  </>
                )}

                {selectedTransaction.adminEmail && (
                  <>
                    <div className="font-medium">Processed By:</div>
                    <div>{selectedTransaction.adminEmail}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

