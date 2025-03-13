import Link from "next/link"
import { ArrowRight, CheckCircle, Users, DollarSign, Shield, Zap, Award, Wallet, Coins } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center font-bold text-xl">
            <Wallet className="h-6 w-6 text-primary mr-1" />
            <Coins className="h-5 w-5 -ml-1 text-primary mr-2" />
            PBS<sup>®</sup>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/get-code" className="text-sm font-medium hover:text-primary">
              Get Code
            </Link>
            <Button asChild variant="outline">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 to-background py-20 md:py-32">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]"></div>
          <div className="container relative z-10 flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
              Turn Your Network Into <span className="text-primary">Net Worth</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Join the elite network of PBS<sup>®</sup> agents and make cash via referrals and investments
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Become an Agent <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/get-code">Get Access Code</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-grid-gray-100/50 dark:bg-grid-gray-950/50">
          <div className="container">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
              <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">
                Why Choose PBS<sup>®</sup>?
              </h2>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                We offer multiple ways to earn and grow your wealth
              </p>
            </div>

            <div className="mx-auto mt-16 grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
              {[
                {
                  icon: Users,
                  title: "Referral Rewards",
                  description: "Earn ₦100 for each person who signs up using your referral link",
                  color: "text-blue-600 dark:text-blue-400",
                  bgColor: "bg-blue-50 dark:bg-blue-950/20",
                },
                {
                  icon: DollarSign,
                  title: "Daily Interest",
                  description: "Earn 4% daily interest on your funded account balance",
                  color: "text-green-600 dark:text-green-400",
                  bgColor: "bg-green-50 dark:bg-green-950/20",
                },
                {
                  icon: Shield,
                  title: "Secure Transactions",
                  description: "Your funds are secure with our protected banking system",
                  color: "text-purple-600 dark:text-purple-400",
                  bgColor: "bg-purple-50 dark:bg-purple-950/20",
                },
                {
                  icon: Zap,
                  title: "Instant Payments",
                  description: "Receive your earnings directly to your bank account",
                  color: "text-yellow-600 dark:text-yellow-400",
                  bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
                },
                {
                  icon: Award,
                  title: "Level Up System",
                  description: "Climb our level system and unlock greater rewards",
                  color: "text-red-600 dark:text-red-400",
                  bgColor: "bg-red-50 dark:bg-red-950/20",
                },
                {
                  icon: CheckCircle,
                  title: "Easy to Start",
                  description: "Simple registration process and user-friendly platform",
                  color: "text-teal-600 dark:text-teal-400",
                  bgColor: "bg-teal-50 dark:bg-teal-950/20",
                },
              ].map((item) => (
                <Card key={item.title} className={`overflow-hidden border shadow-sm transition-all hover:shadow-md`}>
                  <div className={`h-2 w-full ${item.bgColor}`}></div>
                  <CardContent className="p-6">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${item.bgColor}`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

