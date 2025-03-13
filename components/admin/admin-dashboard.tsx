"use client"

import { useState } from "react"
import { useAdmin } from "@/lib/admin-context"
import { signOutAdmin } from "@/lib/admin-auth"
import {
  Users,
  Settings,
  LogOut,
  BarChart3,
  Wallet,
  History,
  Shield,
  ListChecks,
  CreditCard,
  Bell,
  Ticket,
  CheckSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminUsersPanel } from "./admin-users-panel"
import { AdminWithdrawalsPanel } from "./admin-withdrawals-panel"
import { AdminTransactionsPanel } from "./admin-transactions-panel"
import { AdminSettingsPanel } from "./admin-settings-panel"
import { AdminOverviewPanel } from "./admin-overview-panel"
import { AdminTasksPanel } from "./admin-tasks-panel"
import { AdminWallet } from "./admin-wallet"
import { AdminCouponGenerator } from "./admin-coupon-generator"
import { AdminCreditUser } from "./admin-credit-user"
import { AdminNotificationSettings } from "./admin-notification-settings"
import { AdminCompulsoryTasksPanel } from "./admin-compulsory-tasks-panel"

export function AdminDashboard() {
  const { user } = useAdmin()
  const [activeTab, setActiveTab] = useState("overview")

  const handleSignOut = async () => {
    try {
      await signOutAdmin()
      // Auth state will be handled by the context
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <div className="font-bold text-xl">
              PBS<sup>®</sup> Admin
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as: <span className="font-medium text-foreground">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-6">
        {/* Sidebar */}
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r pr-2">
          <nav className="grid items-start px-2 py-4 text-sm font-medium">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("overview")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Users
            </Button>
            <Button
              variant={activeTab === "withdrawals" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("withdrawals")}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Withdrawals
            </Button>
            <Button
              variant={activeTab === "transactions" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("transactions")}
            >
              <History className="mr-2 h-4 w-4" />
              Transactions
            </Button>
            <Button
              variant={activeTab === "tasks" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("tasks")}
            >
              <ListChecks className="mr-2 h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={activeTab === "compulsoryTasks" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("compulsoryTasks")}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Compulsory Tasks
            </Button>
            <Button
              variant={activeTab === "wallet" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("wallet")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Wallet
            </Button>
            <Button
              variant={activeTab === "coupons" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("coupons")}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Coupons
            </Button>
            <Button
              variant={activeTab === "credit-user" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("credit-user")}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Credit User
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("notifications")}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              className="justify-start mb-1"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex w-full flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="compulsoryTasks">Compulsory Tasks</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="coupons">Coupons</TabsTrigger>
              <TabsTrigger value="credit-user">Credit User</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <AdminOverviewPanel />
            </TabsContent>
            <TabsContent value="users" className="space-y-4">
              <AdminUsersPanel />
            </TabsContent>
            <TabsContent value="withdrawals" className="space-y-4">
              <AdminWithdrawalsPanel />
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4">
              <AdminTransactionsPanel />
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
              <AdminTasksPanel />
            </TabsContent>
            <TabsContent value="compulsoryTasks" className="space-y-4">
              <AdminCompulsoryTasksPanel />
            </TabsContent>
            <TabsContent value="wallet" className="space-y-4">
              <AdminWallet />
            </TabsContent>
            <TabsContent value="coupons" className="space-y-4">
              <AdminCouponGenerator />
            </TabsContent>
            <TabsContent value="credit-user" className="space-y-4">
              <AdminCreditUser />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <AdminNotificationSettings />
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <AdminSettingsPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

