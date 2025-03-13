"use client"

import { useState, useEffect } from "react"
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  ListChecks,
  ArrowRight,
  Clock,
  Facebook,
  MessageCircle,
  BookOpen,
  Share2,
  PlayCircle,
} from "lucide-react"
import { doc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"

const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "Starter Ads",
    amount: 5000,
    returnRate: 4.0,
    duration: 30,
    totalReturn: 5000 * 0.04 * 30,
    active: true,
  },
  {
    id: "basic",
    name: "Basic Ads",
    amount: 10000,
    returnRate: 4.0,
    duration: 30,
    totalReturn: 10000 * 0.04 * 30,
    active: false,
  },
  {
    id: "standard",
    name: "Standard Ads",
    amount: 20000,
    returnRate: 4.0,
    duration: 30,
    totalReturn: 20000 * 0.04 * 30,
    active: false,
  },
  {
    id: "premium",
    name: "Premium Ads",
    amount: 50000,
    returnRate: 4.0,
    duration: 30,
    totalReturn: 50000 * 0.04 * 30,
    active: false,
  },
]

export function EarnSection() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("investments")
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [confirmingPlan, setConfirmingPlan] = useState(false)
  const [processingPlan, setProcessingPlan] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeInvestments, setActiveInvestments] = useState<any[]>([])
  const [verifyingTask, setVerifyingTask] = useState(false)
  const [taskVerificationOpen, setTaskVerificationOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [facebookUsername, setFacebookUsername] = useState("")
  const [groupsShared, setGroupsShared] = useState("")
  const [verificationProgress, setVerificationProgress] = useState(0)
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [adWatchTime, setAdWatchTime] = useState(0)
  const [adWatchInterval, setAdWatchInterval] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    if (!user?.uid) return

    const fetchUserData = async () => {
      setLoading(true)
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData(data)

          // Get active investments
          const investments = data.investments || []
          setActiveInvestments(investments)

          // Get completed tasks
          const completedTasks = data.completedTasks || []

          // Fetch tasks from Firestore
          const tasksQuery = query(collection(db, "tasks"), where("isActive", "==", true))
          const tasksSnapshot = await getDocs(tasksQuery)

          const fetchedTasks = tasksSnapshot.docs.map((doc) => {
            const taskData = doc.data()
            return {
              id: doc.id,
              name: taskData.title,
              description: taskData.description,
              reward: taskData.reward,
              link: taskData.link,
              icon: getIconForTask(taskData.title),
              color: getColorForTask(doc.id),
              bgColor: getBgColorForTask(doc.id),
              locked: !completedTasks.includes("whatsapp") && doc.id !== "whatsapp",
              completed: completedTasks.includes(doc.id),
              validationType: taskData.verificationType,
              validationField: taskData.verificationField,
              validationTime: taskData.validationTime,
              isGateway: doc.id === "whatsapp",
            }
          })

          // If no tasks found, use default gateway task
          if (fetchedTasks.length === 0) {
            fetchedTasks.push({
              id: "whatsapp",
              name: "Join WhatsApp Group",
              description: "Join our WhatsApp community for updates and support",
              reward: 0,
              link: "https://chat.whatsapp.com/example",
              icon: MessageCircle,
              color: "text-green-500",
              bgColor: "bg-green-500/10",
              isGateway: true,
              validationType: "phone",
              completed: completedTasks.includes("whatsapp"),
            })
          }

          // Mark completed tasks
          fetchedTasks.forEach((task) => {
            task.completed = completedTasks.includes(task.id)
          })

          setTasks(fetchedTasks)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  // Helper function to get icon for task
  const getIconForTask = (title: string) => {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes("whatsapp") || lowerTitle.includes("chat")) return MessageCircle
    if (lowerTitle.includes("facebook")) return Facebook
    if (lowerTitle.includes("survey") || lowerTitle.includes("class") || lowerTitle.includes("learn")) return BookOpen
    if (lowerTitle.includes("watch") || lowerTitle.includes("video")) return PlayCircle
    if (lowerTitle.includes("share")) return Share2
    return ListChecks
  }

  // Helper function to get color for task
  const getColorForTask = (id: string) => {
    const colors = [
      "text-green-500",
      "text-blue-500",
      "text-purple-500",
      "text-yellow-500",
      "text-red-500",
      "text-indigo-500",
    ]
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  // Helper function to get background color for task
  const getBgColorForTask = (id: string) => {
    const colors = [
      "bg-green-500/10",
      "bg-blue-500/10",
      "bg-purple-500/10",
      "bg-yellow-500/10",
      "bg-red-500/10",
      "bg-indigo-500/10",
    ]
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan)
    setConfirmingPlan(true)
    setError("")
    setSuccess("")
  }

  const handlePlanConfirmation = async () => {
    if (!selectedPlan) return

    setProcessingPlan(true)
    setError("")

    try {
      // Check if user has enough balance
      if (userData.availableForWithdrawal < selectedPlan.amount) {
        setError("Insufficient balance to activate this plan")
        setProcessingPlan(false)
        return
      }

      const userRef = doc(db, "users", user.uid)

      // Create investment record
      const investment = {
        id: `inv-${Date.now()}`,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        dailyReturn: selectedPlan.amount * (selectedPlan.returnRate / 100),
        returnRate: selectedPlan.returnRate,
        duration: selectedPlan.duration,
        totalReturn: selectedPlan.totalReturn,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        daysProcessed: 0,
        totalEarned: 0,
      }

      // Create transaction record
      const transaction = {
        id: `inv-${Date.now()}`,
        type: "investment",
        amount: selectedPlan.amount,
        date: new Date().toISOString(),
        status: "completed",
        description: `Activated ${selectedPlan.name} investment plan`,
      }

      // Update user document
      await updateDoc(userRef, {
        availableForWithdrawal: increment(-selectedPlan.amount),
        investments: arrayUnion(investment),
        transactions: arrayUnion(transaction),
      })

      // Update local state
      setActiveInvestments([...activeInvestments, investment])
      setSuccess(`Successfully activated ${selectedPlan.name} plan`)

      // Update user data
      const updatedUserDoc = await getDoc(userRef)
      if (updatedUserDoc.exists()) {
        setUserData(updatedUserDoc.data())
      }
    } catch (error) {
      console.error("Error activating investment plan:", error)
      setError("Failed to activate investment plan. Please try again.")
    } finally {
      setProcessingPlan(false)
      setConfirmingPlan(false)
    }
  }

  const handleTaskClick = (task) => {
    if (task.locked) return

    if (task.completed) {
      // Task already completed
      return
    }

    if (task.isGateway) {
      // For WhatsApp group task
      setCurrentTask(task)
      window.open(task.link, "_blank")

      // Open verification dialog after a short delay
      setTimeout(() => {
        setTaskVerificationOpen(true)
      }, 2000)
    } else {
      // For other tasks
      window.open(task.link, "_blank")

      // Open verification dialog
      setCurrentTask(task)
      setTaskVerificationOpen(true)
    }
  }

  const verifyTask = async () => {
    if (!currentTask) return

    setVerifyingTask(true)
    setVerificationProgress(0)

    // Different verification methods based on task type
    if (currentTask.validationType === "timer") {
      // For ad watching, start a timer
      const totalTime = currentTask.validationTime
      setAdWatchTime(0)

      const interval = setInterval(() => {
        setAdWatchTime((prev) => {
          const newTime = prev + 1
          setVerificationProgress((newTime / totalTime) * 100)

          if (newTime >= totalTime) {
            clearInterval(interval)
            completeTaskVerification()
          }

          return newTime
        })
      }, 1000)

      setAdWatchInterval(interval)
    } else {
      // For other tasks, simulate verification process
      const interval = setInterval(() => {
        setVerificationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 100 / 15
        })
      }, 1000)

      // Complete verification after 15 seconds
      setTimeout(() => {
        clearInterval(interval)
        completeTaskVerification()
      }, 15000)
    }
  }

  const completeTaskVerification = async () => {
    setVerificationProgress(100)
    setVerificationComplete(true)

    try {
      const userRef = doc(db, "users", user.uid)

      // Create transaction record if task has reward
      if (currentTask.reward > 0) {
        const transaction = {
          id: `task-${Date.now()}`,
          type: "task_reward",
          amount: currentTask.reward,
          date: new Date().toISOString(),
          status: "completed",
          description: `Reward for completing task: ${currentTask.name}`,
        }

        // Update user document
        await updateDoc(userRef, {
          availableForWithdrawal: increment(currentTask.reward),
          completedTasks: arrayUnion(currentTask.id),
          transactions: arrayUnion(transaction),
        })
      } else {
        // Just mark task as completed
        await updateDoc(userRef, {
          completedTasks: arrayUnion(currentTask.id),
        })
      }

      // Update tasks
      const updatedTasks = [...tasks]

      // Mark current task as completed
      const taskIndex = updatedTasks.findIndex((t) => t.id === currentTask.id)
      if (taskIndex !== -1) {
        updatedTasks[taskIndex].completed = true
      }

      // If whatsapp task is completed, unlock other tasks
      if (currentTask.id === "whatsapp") {
        updatedTasks.forEach((task) => {
          if (task.id !== "whatsapp") {
            task.locked = false
          }
        })
      }

      setTasks(updatedTasks)

      // Update user data
      const updatedUserDoc = await getDoc(userRef)
      if (updatedUserDoc.exists()) {
        setUserData(updatedUserDoc.data())
      }
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const resetTaskVerification = () => {
    if (adWatchInterval) {
      clearInterval(adWatchInterval)
      setAdWatchInterval(null)
    }

    setTaskVerificationOpen(false)
    setVerifyingTask(false)
    setVerificationProgress(0)
    setVerificationComplete(false)
    setPhoneNumber("")
    setFacebookUsername("")
    setGroupsShared("")
    setAdWatchTime(0)
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (adWatchInterval) {
        clearInterval(adWatchInterval)
      }
    }
  }, [adWatchInterval])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-primary/20 shadow-md">
        <div className="h-2 w-full bg-gradient-to-r from-primary to-primary/60"></div>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <DollarSign className="mr-2 h-6 w-6 text-primary" />
            Earn More
          </CardTitle>
          <CardDescription className="text-base">Choose how you want to earn additional income</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="investments">
                <TrendingUp className="mr-2 h-4 w-4" />
                Money Value
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListChecks className="mr-2 h-4 w-4" />
                Tasks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="investments" className="space-y-6 pt-6">
              {activeInvestments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Active Investments</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeInvestments.map((investment) => {
                      // Calculate days remaining
                      const endDate = new Date(investment.endDate)
                      const now = new Date()
                      const daysRemaining = Math.max(
                        0,
                        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                      )

                      // Calculate progress percentage
                      const progress = ((investment.duration - daysRemaining) / investment.duration) * 100

                      return (
                        <Card key={investment.id} className="border-primary/20">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{investment.planName}</CardTitle>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                Active
                              </Badge>
                            </div>
                            <CardDescription>{formatCurrency(investment.amount)} invested</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Daily Return:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(investment.dailyReturn)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Earned:</span>
                              <span className="font-medium">{formatCurrency(investment.totalEarned || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Days Remaining:</span>
                              <span className="font-medium">
                                {daysRemaining} of {investment.duration} days
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Investment Plans</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {INVESTMENT_PLANS.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`border-2 ${plan.active ? "border-primary/20" : "border-muted opacity-70"}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {!plan.active && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{formatCurrency(plan.amount)} investment</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Daily Return:</span>
                          <span className="font-medium text-green-600">
                            {plan.returnRate}% ({formatCurrency(plan.amount * (plan.returnRate / 100))})
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">{plan.duration} days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Return:</span>
                          <span className="font-medium text-green-600">{formatCurrency(plan.totalReturn)}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" disabled={!plan.active} onClick={() => handlePlanSelection(plan)}>
                          {plan.active ? "Activate Plan" : "Coming Soon"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-500/10 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Complete Tasks to Earn</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {tasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`border-2 ${
                        task.completed
                          ? "border-green-500/20 bg-green-500/5"
                          : task.locked
                            ? "border-muted opacity-70"
                            : "border-primary/20"
                      } cursor-pointer transition-all hover:shadow-md`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`mr-2 rounded-full p-2 ${task.bgColor}`}>
                              <task.icon className={`h-4 w-4 ${task.color}`} />
                            </div>
                            <CardTitle className="text-base">{task.name}</CardTitle>
                          </div>
                          {task.completed ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              Completed
                            </Badge>
                          ) : task.locked ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground">
                              Locked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                              Available
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{task.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reward:</span>
                          <span className="font-medium text-green-600">
                            {task.reward > 0 ? formatCurrency(task.reward) : "Unlocks more tasks"}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="ghost" size="sm" className="ml-auto" disabled={task.locked || task.completed}>
                          {task.completed ? "Completed" : task.locked ? "Locked" : "Start Task"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>

              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertTitle>Important Warning</AlertTitle>
                <AlertDescription>
                  Dishonesty in task completion will result in restrictions on withdrawals. All task completions are
                  verified by our system.
                </AlertDescription>
              </Alert>

              {tasks.some((task) => task.locked) && (
                <Alert className="bg-blue-500/10 border-blue-500/50">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Complete Gateway Task</AlertTitle>
                  <AlertDescription>
                    Join our WhatsApp group to unlock more tasks and earn additional rewards
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Plan Confirmation Dialog */}
      <Dialog open={confirmingPlan} onOpenChange={setConfirmingPlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Investment Plan</DialogTitle>
            <DialogDescription>You are about to activate the {selectedPlan?.name} investment plan</DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border p-4">
                <div className="flex justify-between py-1">
                  <span className="font-medium">Investment Amount:</span>
                  <span>{formatCurrency(selectedPlan.amount)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Daily Return:</span>
                  <span className="text-green-600">
                    {selectedPlan.returnRate}% ({formatCurrency(selectedPlan.amount * (selectedPlan.returnRate / 100))})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Duration:</span>
                  <span>{selectedPlan.duration} days</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-medium">Total Return:</span>
                  <span className="text-green-600">{formatCurrency(selectedPlan.totalReturn)}</span>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This amount will be deducted from your available balance. Daily returns will be added to your
                  available balance automatically.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingPlan(false)} disabled={processingPlan}>
              Cancel
            </Button>
            <Button onClick={handlePlanConfirmation} disabled={processingPlan}>
              {processingPlan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Activate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Verification Dialog */}
      <Dialog open={taskVerificationOpen} onOpenChange={setTaskVerificationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Task Completion</DialogTitle>
            <DialogDescription>
              {currentTask?.isGateway
                ? "Confirm that you've joined our WhatsApp group"
                : `Confirm that you've completed the task: ${currentTask?.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!verifyingTask ? (
              <>
                {currentTask?.validationType === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Your WhatsApp Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="Enter your WhatsApp number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll use this to verify your membership in the group
                    </p>
                  </div>
                )}

                {currentTask?.validationType === "username" && (
                  <div className="space-y-2">
                    <Label htmlFor="username">{currentTask.validationField}</Label>
                    <Input
                      id="username"
                      placeholder={`Enter your ${currentTask.validationField}`}
                      value={facebookUsername}
                      onChange={(e) => setFacebookUsername(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      We'll verify your follow status on our Facebook page
                    </p>
                  </div>
                )}

                {currentTask?.validationType === "groups" && (
                  <div className="space-y-2">
                    <Label htmlFor="groupsShared">{currentTask.validationField}</Label>
                    <Input
                      id="groupsShared"
                      type="number"
                      placeholder="Enter number of groups"
                      value={groupsShared}
                      onChange={(e) => setGroupsShared(e.target.value)}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Please be honest about the number of groups you've shared to
                    </p>
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Verification Required</AlertTitle>
                  <AlertDescription>
                    {currentTask?.isGateway
                      ? "Have you joined our WhatsApp group? This will unlock additional tasks."
                      : currentTask?.validationType === "timer"
                        ? "You'll need to watch the ad for at least 30 seconds to earn the reward."
                        : "Have you completed this task? Your reward will be added to your balance."}
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Dishonesty in task completion will result in restrictions on withdrawals. All task completions are
                    subject to verification.
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="space-y-4">
                {!verificationComplete ? (
                  <>
                    <div className="flex items-center justify-center py-4">
                      <div className="relative h-24 w-24">
                        <div className="absolute inset-0 flex items-center justify-center">
                          {currentTask?.validationType === "timer" ? (
                            <span className="text-lg font-bold text-primary">{adWatchTime}s</span>
                          ) : (
                            <Clock className="h-8 w-8 text-primary animate-pulse" />
                          )}
                        </div>
                        <svg className="h-24 w-24" viewBox="0 0 100 100">
                          <circle
                            className="stroke-muted-foreground/20"
                            cx="50"
                            cy="50"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            className="stroke-primary"
                            cx="50"
                            cy="50"
                            r="40"
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (251.2 * verificationProgress) / 100}
                            transform="rotate(-90 50 50)"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium">
                        {currentTask?.validationType === "timer"
                          ? "Watching advertisement"
                          : "Verifying your task completion"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {currentTask?.validationType === "timer"
                          ? `Please watch the ad for ${currentTask.validationTime} seconds to earn your reward`
                          : "Please wait while we verify your task completion..."}
                      </p>
                      <Progress value={verificationProgress} className="mt-4" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="rounded-full bg-green-500/10 p-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium">Verification Complete!</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {currentTask?.isGateway
                        ? "You've successfully joined our WhatsApp group. Additional tasks are now unlocked!"
                        : `You've successfully completed the task: ${currentTask?.name}`}
                    </p>
                    {currentTask?.reward > 0 && (
                      <div className="mt-4 rounded-lg bg-green-500/10 p-4 text-green-600">
                        <p className="font-medium">Reward: {formatCurrency(currentTask.reward)}</p>
                        <p className="text-xs">Added to your available balance</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!verifyingTask ? (
              <>
                <Button variant="outline" onClick={resetTaskVerification}>
                  Cancel
                </Button>
                <Button
                  onClick={verifyTask}
                  disabled={
                    (currentTask?.validationType === "phone" && !phoneNumber) ||
                    (currentTask?.validationType === "username" && !facebookUsername) ||
                    (currentTask?.validationType === "groups" && !groupsShared)
                  }
                >
                  Verify Completion
                </Button>
              </>
            ) : (
              <Button onClick={resetTaskVerification} disabled={!verificationComplete}>
                {verificationComplete ? "Close" : "Verifying..."}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

