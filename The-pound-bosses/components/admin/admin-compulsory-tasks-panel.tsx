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
import { MoreHorizontal, Edit, Trash, AlertCircle, Loader2, Plus, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CompulsoryTask {
  id: string
  title: string
  description: string
  link: string
  verificationType: string
  verificationField: string
  createdAt: string
  updatedAt: string
}

export function AdminCompulsoryTasksPanel() {
  const { user } = useAdmin()
  const [tasks, setTasks] = useState<CompulsoryTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    id: "",
    title: "",
    description: "",
    link: "",
    verificationType: "phone",
    verificationField: "",
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<CompulsoryTask | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    fetchCompulsoryTasks()
  }, [])

  const fetchCompulsoryTasks = async () => {
    try {
      setLoading(true)
      const tasksQuery = query(collection(db, "compulsoryTasks"), orderBy("createdAt", "desc"))
      const tasksSnapshot = await getDocs(tasksQuery)
      const fetchedTasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CompulsoryTask[]
      setTasks(fetchedTasks)
    } catch (error) {
      console.error("Error fetching compulsory tasks:", error)
      setError("Failed to load compulsory tasks. Please try refreshing the page.")
    } finally {
      setLoading(false)
    }
  }

  const openAddTaskDialog = () => {
    setTaskForm({
      id: "",
      title: "",
      description: "",
      link: "",
      verificationType: "phone",
      verificationField: "",
    })
    setIsAddingTask(true)
    setError("")
    setSuccess("")
  }

  const openEditTaskDialog = (task: CompulsoryTask) => {
    setTaskForm({
      id: task.id,
      title: task.title,
      description: task.description,
      link: task.link,
      verificationType: task.verificationType,
      verificationField: task.verificationField,
    })
    setIsEditingTask(true)
    setError("")
    setSuccess("")
  }

  const openDeleteConfirmation = (task: CompulsoryTask) => {
    setTaskToDelete(task)
    setDeleteConfirmOpen(true)
    setError("")
    setSuccess("")
  }

  const handleAddTask = async () => {
    if (!user) return

    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.link.trim()) {
      setError("All fields are required")
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()

      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        link: taskForm.link,
        verificationType: taskForm.verificationType,
        verificationField: taskForm.verificationField,
        createdAt: now,
        updatedAt: now,
      }

      const docRef = await addDoc(collection(db, "compulsoryTasks"), taskData)

      await logAdminAction(user.uid, user.email || "", "add_compulsory_task", { taskId: docRef.id, ...taskData })

      setTasks((prevTasks) => [{ id: docRef.id, ...taskData } as CompulsoryTask, ...prevTasks])

      setSuccess("Compulsory task added successfully")
      setIsAddingTask(false)
    } catch (error) {
      console.error("Error adding compulsory task:", error)
      setError("Failed to add compulsory task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateTask = async () => {
    if (!user) return

    if (!taskForm.title.trim() || !taskForm.description.trim() || !taskForm.link.trim()) {
      setError("All fields are required")
      return
    }

    setIsProcessing(true)

    try {
      const now = new Date().toISOString()
      const taskRef = doc(db, "compulsoryTasks", taskForm.id)

      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        link: taskForm.link,
        verificationType: taskForm.verificationType,
        verificationField: taskForm.verificationField,
        updatedAt: now,
      }

      await updateDoc(taskRef, taskData)
      await logAdminAction(user.uid, user.email || "", "update_compulsory_task", { taskId: taskForm.id, ...taskData })

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskForm.id ? { ...task, ...taskData, id: task.id, createdAt: task.createdAt } : task,
        ),
      )

      setSuccess("Compulsory task updated successfully")
      setIsEditingTask(false)
    } catch (error) {
      console.error("Error updating compulsory task:", error)
      setError("Failed to update compulsory task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteTask = async () => {
    if (!user || !taskToDelete) return

    setIsProcessing(true)

    try {
      await deleteDoc(doc(db, "compulsoryTasks", taskToDelete.id))
      await logAdminAction(user.uid, user.email || "", "delete_compulsory_task", {
        taskId: taskToDelete.id,
        title: taskToDelete.title,
      })

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskToDelete.id))

      setSuccess("Compulsory task deleted successfully")
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error("Error deleting compulsory task:", error)
      setError("Failed to delete compulsory task. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading compulsory tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Compulsory Tasks Management</CardTitle>
            <CardDescription>Create and manage compulsory tasks for new users</CardDescription>
          </div>
          <Button onClick={openAddTaskDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Compulsory Task
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
                  <TableHead>Verification Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.verificationType}</TableCell>
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
                    <TableCell colSpan={3} className="h-24 text-center">
                      No compulsory tasks found. Click "Add Compulsory Task" to create your first task.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Task Dialog */}
      <Dialog
        open={isAddingTask || isEditingTask}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingTask(false)
            setIsEditingTask(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAddingTask ? "Add New Compulsory Task" : "Edit Compulsory Task"}</DialogTitle>
            <DialogDescription>
              {isAddingTask ? "Create a new compulsory task for users to complete" : "Update compulsory task details"}
            </DialogDescription>
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
                  <SelectItem value="phone">Phone Number</SelectItem>
                  <SelectItem value="username">Username</SelectItem>
                  <SelectItem value="confirmation">Simple Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {taskForm.verificationType === "username" && (
              <div className="grid gap-2">
                <Label htmlFor="verificationField">Username Field Label</Label>
                <Input
                  id="verificationField"
                  value={taskForm.verificationField}
                  onChange={(e) => setTaskForm({ ...taskForm, verificationField: e.target.value })}
                  placeholder="e.g., WhatsApp Username"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingTask(false)
                setIsEditingTask(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={isAddingTask ? handleAddTask : handleUpdateTask} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAddingTask ? "Adding..." : "Updating..."}
                </>
              ) : (
                <>
                  {isAddingTask ? <Plus className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {isAddingTask ? "Add Task" : "Update Task"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Compulsory Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this compulsory task? This action cannot be undone.
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

