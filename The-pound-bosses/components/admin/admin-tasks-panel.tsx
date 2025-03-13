"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { logAdminAction } from "@/lib/admin-auth"
import { useAdmin } from "@/lib/admin-context"
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Edit, Trash, AlertCircle, Loader2, Plus, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Task {
  id: string
  title: string
  description: string
  reward: number
  accountsRequired: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  link: string
  verificationType: string
  verificationTime: number
  verificationField: string
}

export function AdminTasksPanel() {
  const { user } = useAdmin()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Task form state
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    id: "",
    title: "",
    description: "",
    reward: 0,
    accountsRequired: 1,
    isActive: true,
    link: "",
    verificationType: "confirmation", // Options: confirmation, phone, username, timer, groups
    verificationTime: 30, // For timer verification
    verificationField: "", // For username or groups verification
  })

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false)
  const [notifyUsers, setNotifyUsers] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)

      const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"))

      const tasksSnapshot = await getDocs(tasksQuery)

      const fetchedTasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[]

      setTasks(fetchedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setError("Failed to load tasks. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const openAddTaskDialog = () => {
    setTaskForm({
      id: "",
      title: "",
      description: "",
      reward: 0,
      accountsRequired: 1,
      isActive: true,
      link: "",
      verificationType: "confirmation", // Options: confirmation, phone, username, timer, groups
      verificationTime: 30, // For timer verification
      verificationField: "", // For username or groups verification
    })
    setIsAddingTask(true)
    setError("")
    setSuccess("")
  }

  const openEditTaskDialog = (task: Task) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description,
      reward: task.reward,
      accountsRequired: task.accountsRequired,
      isActive: task.isActive,
      link: task.link,
      verificationType: task.verificationType,
      verificationTime: task.verificationTime,
      verificationField: task.verificationField,
    })
    setIsEditingTask(true)
    setError("")
    setSuccess("")
  }

  const openDeleteConfirmation = (task: Task) => {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
    setError("")
    setSuccess("")
  }

  const handleAddTask = async () => {
    if (!user) return

    // Validate form
    if (!taskForm.title.trim()) {
      setError("Task title is required")
      return
    }

    if (!taskForm.description.trim()) {
      setError("Task description is required")
      return
    }

    if (!taskForm.link.trim()) {
      setError("Task link is required")
      return
    }

    if (taskForm.reward < 0) {
      setError("Reward must be a positive number")
      return
    }

    if (taskForm.accountsRequired < 1) {
      setError("Number of accounts required must be at least 1")
      return
    }

    if (
      (taskForm.verificationType === "username" || taskForm.verificationType === "groups") &&
      !taskForm.verificationField.trim()
    ) {
      setError("Verification field label is required")
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()

      // Add new task to Firestore
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        reward: taskForm.reward,
        accountsRequired: taskForm.accountsRequired,
        isActive: taskForm.isActive,
        link: taskForm.link,
        verificationType: taskForm.verificationType,
        verificationTime: taskForm.verificationTime,
        verificationField: taskForm.verificationField,
        notifyUsers: notifyUsers,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await addDoc(collection(db, "tasks"), taskData)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "add_task", { taskId: docRef.id, ...taskData })

      // Notify users if enabled
      if (notifyUsers) {
        // Implement user notification logic here
        // This could involve sending push notifications, emails, or updating a user's notification collection
      }

      // Update local state
      setTasks((prevTasks) => [{ id: docRef.id, ...taskData } as Task, ...prevTasks])

      setSuccess("Task added successfully")
      setIsAddingTask(false)
    } catch (error) {
      console.error("Error adding task:", error)
      setError("Failed to add task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!user) return

    // Validate form
    if (!taskForm.title.trim()) {
      setError("Task title is required")
      return
    }

    if (!taskForm.description.trim()) {
      setError("Task description is required")
      return
    }

    if (!taskForm.link.trim()) {
      setError("Task link is required")
      return
    }

    if (taskForm.reward < 0) {
      setError("Reward must be a positive number")
      return
    }

    if (taskForm.accountsRequired < 1) {
      setError("Number of accounts required must be at least 1")
      return
    }

    if (
      (taskForm.verificationType === "username" || taskForm.verificationType === "groups") &&
      !taskForm.verificationField.trim()
    ) {
      setError("Verification field label is required")
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()

      // Update task in Firestore
      const taskRef = doc(db, "tasks", taskForm.id)

      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        reward: taskForm.reward,
        accountsRequired: taskForm.accountsRequired,
        isActive: taskForm.isActive,
        updatedAt: now,
        link: taskForm.link,
        verificationType: taskForm.verificationType,
        verificationTime: taskForm.verificationTime,
        verificationField: taskForm.verificationField,
      }

      await updateDoc(taskRef, taskData)

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "update_task", { taskId: taskForm.id, ...taskData })

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskForm.id ? { ...task, ...taskData, id: task.id, createdAt: task.createdAt } : task,
        ),
      )

      setSuccess("Task updated successfully")
      setIsEditingTask(false)
    } catch (error) {
      console.error("Error updating task:", error)
      setError("Failed to update task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!user || !taskToDelete) return

    setIsProcessing(true)

    try {
      // Delete task from Firestore
      await deleteDoc(doc(db, "tasks", taskToDelete.id))

      // Log admin action
      await logAdminAction(user.uid, user.email || "", "delete_task", {
        taskId: taskToDelete.id,
        title: taskToDelete.title,
      })

      // Update local state
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskToDelete.id))

      setSuccess("Task deleted successfully")
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error("Error deleting task:", error)
      setError("Failed to delete task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>Create and manage tasks for users to complete</CardDescription>
          </div>
          <Button onClick={openAddTaskDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-500/10 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Accounts Required</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{formatCurrency(task.reward)}</TableCell>
                      <TableCell>{task.accountsRequired}</TableCell>
                      <TableCell>
                        {task.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            Inactive
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
                            <DropdownMenuItem onClick={() => openEditTaskDialog(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteConfirmation(task)} className="text-red-600">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No tasks found. Click "Add Task" to create your first task.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={(open) => !open && setIsAddingTask(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for users to complete</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Task Description</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Enter detailed instructions for the task"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="link">Task Link</Label>
              <Input
                id="link"
                value={taskForm.link}
                onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
                placeholder="Enter task URL (e.g., https://example.com)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="reward">Reward Amount (₦)</Label>
                <Input
                  id="reward"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taskForm.reward}
                  onChange={(e) => setTaskForm({ ...taskForm, reward: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountsRequired">Accounts Required</Label>
                <Input
                  id="accountsRequired"
                  type="number"
                  min="1"
                  value={taskForm.accountsRequired}
                  onChange={(e) => setTaskForm({ ...taskForm, accountsRequired: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="verificationType">Verification Method</Label>
              <Select
                value={taskForm.verificationType}
                onValueChange={(value) => setTaskForm({ ...taskForm, verificationType: value })}
              >
                <SelectTrigger id="verificationType">
                  <SelectValue placeholder="Select verification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Simple Confirmation</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="timer">Watch Timer</SelectItem>
                  <SelectItem value="groups">Group Sharing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {taskForm.verificationType === "timer" && (
              <div className="grid gap-2">
                <Label htmlFor="verificationTime">Watch Time (seconds)</Label>
                <Input
                  id="verificationTime"
                  type="number"
                  min="5"
                  value={taskForm.verificationTime}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, verificationTime: Number.parseInt(e.target.value) || 30 })
                  }
                />
              </div>
            )}

            {(taskForm.verificationType === "username" || taskForm.verificationType === "groups") && (
              <div className="grid gap-2">
                <Label htmlFor="verificationField">
                  {taskForm.verificationType === "username" ? "Username Field Label" : "Groups Field Label"}
                </Label>
                <Input
                  id="verificationField"
                  value={taskForm.verificationField}
                  onChange={(e) => setTaskForm({ ...taskForm, verificationField: e.target.value })}
                  placeholder={
                    taskForm.verificationType === "username"
                      ? "e.g., Facebook Username"
                      : "e.g., Number of groups shared to"
                  }
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={taskForm.isActive}
                onCheckedChange={(checked) => setTaskForm({ ...taskForm, isActive: checked === true })}
              />
              <Label htmlFor="isActive">Task is active and visible to users</Label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="notify-users" checked={notifyUsers} onCheckedChange={setNotifyUsers} />
            <Label htmlFor="notify-users">Notify users about this new task</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Task Dialog */}
      <Dialog open={isEditingTask} onOpenChange={(open) => !open && setIsEditingTask(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details and settings</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Task Title</Label>
              <Input
                id="edit-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Task Description</Label>
              <Textarea
                id="edit-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-link">Task Link</Label>
              <Input
                id="edit-link"
                value={taskForm.link}
                onChange={(e) => setTaskForm({ ...taskForm, link: e.target.value })}
                placeholder="Enter task URL (e.g., https://example.com)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-reward">Reward Amount (₦)</Label>
                <Input
                  id="edit-reward"
                  type="number"
                  min="0"
                  step="0.01"
                  value={taskForm.reward}
                  onChange={(e) => setTaskForm({ ...taskForm, reward: Number.parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-accountsRequired">Accounts Required</Label>
                <Input
                  id="edit-accountsRequired"
                  type="number"
                  min="1"
                  value={taskForm.accountsRequired}
                  onChange={(e) => setTaskForm({ ...taskForm, accountsRequired: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-verificationType">Verification Method</Label>
              <Select
                value={taskForm.verificationType}
                onValueChange={(value) => setTaskForm({ ...taskForm, verificationType: value })}
              >
                <SelectTrigger id="edit-verificationType">
                  <SelectValue placeholder="Select verification method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Simple Confirmation</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="timer">Watch Timer</SelectItem>
                  <SelectItem value="groups">Group Sharing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {taskForm.verificationType === "timer" && (
              <div className="grid gap-2">
                <Label htmlFor="edit-verificationTime">Watch Time (seconds)</Label>
                <Input
                  id="edit-verificationTime"
                  type="number"
                  min="5"
                  value={taskForm.verificationTime}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, verificationTime: Number.parseInt(e.target.value) || 30 })
                  }
                />
              </div>
            )}

            {(taskForm.verificationType === "username" || taskForm.verificationType === "groups") && (
              <div className="grid gap-2">
                <Label htmlFor="edit-verificationField">
                  {taskForm.verificationType === "username" ? "Username Field Label" : "Groups Field Label"}
                </Label>
                <Input
                  id="edit-verificationField"
                  value={taskForm.verificationField}
                  onChange={(e) => setTaskForm({ ...taskForm, verificationField: e.target.value })}
                  placeholder={
                    taskForm.verificationType === "username"
                      ? "e.g., Facebook Username"
                      : "e.g., Number of groups shared to"
                  }
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-isActive"
                checked={taskForm.isActive}
                onCheckedChange={(checked) => setTaskForm({ ...taskForm, isActive: checked === true })}
              />
              <Label htmlFor="edit-isActive">Task is active and visible to users</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Update Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ;
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {taskToDelete && (
            <div className="py-4">
              <div className="rounded-md border p-4">
                <h4 className="font-medium">{taskToDelete.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{taskToDelete.description}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

