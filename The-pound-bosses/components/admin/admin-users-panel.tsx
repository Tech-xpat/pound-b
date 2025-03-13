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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Search, MoreHorizontal, AlertCircle, Loader2, Plus, CreditCard, Ban, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function AdminUsersPanel() {
  const { user } = useAdmin()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [pointsToAdd, setPointsToAdd] = useState(0)
  const [isAddingPoints, setIsAddingPoints] = useState(false)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  const fetchUsers = async (searchTerm = "", startAfterDoc = null) => {
    try {
      setLoading(true)

      let usersQuery

      if (searchTerm) {
        // Search by username, email, or ID
        usersQuery = query(
          collection(db, "users"),
          where("username", ">=", searchTerm),
          where("username", "<=", searchTerm + "\uf8ff"),
          limit(10),
        )
      } else {
        // Get all users with pagination
        usersQuery = startAfterDoc
          ? query(collection(db, "users"), orderBy("createdAt", "desc"), startAfter(startAfterDoc), limit(10))
          : query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10))
      }

      const usersSnapshot = await getDocs(usersQuery)

      if (usersSnapshot.empty) {
        if (!startAfterDoc) {
          setUsers([])
        }
        setHasMore(false)
      } else {
        const lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1]
        setLastVisible(lastDoc)

        const fetchedUsers = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        if (startAfterDoc) {
          setUsers((prevUsers) => [...prevUsers, ...fetchedUsers])
        } else {
          setUsers(fetchedUsers)
        }

        setHasMore(usersSnapshot.docs.length === 10)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Failed to load users. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setUsers([])
    setLastVisible(null)
    setHasMore(true)
    fetchUsers(searchQuery)
  }

  const loadMoreUsers = () => {
    if (lastVisible) {
      fetchUsers(searchQuery, lastVisible)
    }
  }

  const handleAddPoints = async () => {
    if (!editingUser || pointsToAdd <= 0) return

    setIsAddingPoints(true)

    try {
      const userRef = doc(db, "users", editingUser.id)

      // Get current earnings
      const currentEarnings = editingUser.earnings || 0

      // Update user earnings
      await updateDoc(userRef, {
        earnings: currentEarnings + pointsToAdd,
      })

      // Create transaction record
      const transactionData = {
        userId: editingUser.id,
        amount: pointsToAdd,
        type: "admin_credit",
        description: "Points added by admin",
        timestamp: new Date().toISOString(),
        adminId: user?.uid,
        adminEmail: user?.email,
      }

      // Add to transactions collection
      await setDoc(doc(collection(db, "transactions"), new Date().toISOString()), transactionData)

      // Log admin action
      await logAdminAction(user?.uid || "", user?.email || "", "add_points", {
        userId: editingUser.id,
        amount: pointsToAdd,
      })

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === editingUser.id ? { ...u, earnings: currentEarnings + pointsToAdd } : u)),
      )

      // Reset form
      setEditingUser(null)
      setPointsToAdd(0)
    } catch (error) {
      console.error("Error adding points:", error)
      setError("Failed to add points. Please try again.")
    } finally {
      setIsAddingPoints(false)
    }
  }

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    setIsUpdatingUser(true)

    try {
      const userRef = doc(db, "users", userId)

      await updateDoc(userRef, {
        isActive: isActive,
      })

      // Log admin action
      await logAdminAction(user?.uid || "", user?.email || "", isActive ? "activate_user" : "deactivate_user", {
        userId,
      })

      // Update local state
      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? { ...u, isActive } : u)))
    } catch (error) {
      console.error("Error updating user status:", error)
      setError("Failed to update user status. Please try again.")
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const viewUserDetails = (user: any) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 mb-4">
            <Input
              type="search"
              placeholder="Search by username or email"
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
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatCurrency(user.earnings || 0)}</TableCell>
                      <TableCell>{user.referrals || 0}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        {user.isActive === false ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Inactive
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        )}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                              <Search className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Add Points
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.isActive === false ? (
                              <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, true)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUpdateUserStatus(user.id, false)}>
                                <Ban className="mr-2 h-4 w-4" />
                                Deactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={loadMoreUsers} disabled={loading || !hasMore}>
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

      {/* Add Points Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Points to User</DialogTitle>
            <DialogDescription>
              Add points to {editingUser?.username}'s account. This will increase their earnings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="points">Points Amount</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddPoints} disabled={isAddingPoints || pointsToAdd <= 0}>
              {isAddingPoints ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Points
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>Detailed information about {selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">User ID:</div>
                <div>{selectedUser.id}</div>

                <div className="font-medium">Username:</div>
                <div>{selectedUser.username}</div>

                <div className="font-medium">Email:</div>
                <div>{selectedUser.email}</div>

                <div className="font-medium">Earnings:</div>
                <div>{formatCurrency(selectedUser.earnings || 0)}</div>

                <div className="font-medium">Referrals:</div>
                <div>{selectedUser.referrals || 0}</div>

                <div className="font-medium">Ads Run:</div>
                <div>{selectedUser.adsRun || 0}</div>

                <div className="font-medium">Joined:</div>
                <div>{formatDate(selectedUser.createdAt)}</div>

                <div className="font-medium">Last Login:</div>
                <div>{formatDate(selectedUser.lastLogin)}</div>

                <div className="font-medium">Status:</div>
                <div>
                  {selectedUser.isActive === false ? (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setEditingUser(selectedUser)}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Add Points
                </Button>

                {selectedUser.isActive === false ? (
                  <Button
                    variant="default"
                    onClick={() => handleUpdateUserStatus(selectedUser.id, true)}
                    disabled={isUpdatingUser}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate User
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateUserStatus(selectedUser.id, false)}
                    disabled={isUpdatingUser}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Deactivate User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

