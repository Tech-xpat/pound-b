import Link from "next/link"
import { ArrowRight, CheckCircle, Users, DollarSign, Shield, Zap, Award, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-bold text-xl">Pounds Bosses</div>
          <Button asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 to-background py-20">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]"></div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              About <span className="text-primary">Pounds Bosses</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Empowering Nigerians to build wealth through networking and smart investments
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Join Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/get-code">Get Access Code</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Mission</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                At Pounds Bosses, we're on a mission to democratize wealth creation in Nigeria by providing a platform
                that rewards network building and smart investments. We believe everyone deserves the opportunity to
                achieve financial freedom.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent border-blue-200 dark:border-blue-800 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  <CardTitle>Community Driven</CardTitle>
                  <CardDescription>
                    We're building a community of ambitious individuals who support each other's growth
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Our platform thrives on the power of community. When you succeed, we all succeed. Join a network of
                    like-minded individuals working together toward financial independence.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-transparent dark:from-green-950/20 dark:to-transparent border-green-200 dark:border-green-800 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <DollarSign className="h-12 w-12 text-green-600 dark:text-green-400" />
                  <CardTitle>Financial Empowerment</CardTitle>
                  <CardDescription>
                    We provide multiple streams of income through referrals and investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    From referral bonuses to daily interest on investments, we've created multiple ways for you to earn.
                    Our transparent reward system ensures you're fairly compensated for your efforts.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-950/20 dark:to-transparent border-purple-200 dark:border-purple-800 shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <Shield className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  <CardTitle>Security & Transparency</CardTitle>
                  <CardDescription>
                    Your security is our priority with transparent operations and secure transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    We implement industry-standard security measures to protect your data and funds. All transactions
                    are recorded and traceable, ensuring complete transparency in our operations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our platform is designed to be simple, transparent, and rewarding. Here's how you can start earning with
                Pounds Bosses.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-4">
              {[
                {
                  icon: Gift,
                  title: "Get Your Access Code",
                  description:
                    "Obtain an exclusive invitation code from an existing agent or generate your own coupon code",
                  color: "text-pink-600 dark:text-pink-400",
                  bgColor: "bg-pink-50 dark:bg-pink-950/20",
                  borderColor: "border-pink-200 dark:border-pink-800",
                },
                {
                  icon: Users,
                  title: "Complete Registration",
                  description: "Sign up with your email and create your unique username to join our community",
                  color: "text-yellow-600 dark:text-yellow-400",
                  bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
                  borderColor: "border-yellow-200 dark:border-yellow-800",
                },
                {
                  icon: Zap,
                  title: "Start Earning",
                  description: "Begin referring others and earning commissions on successful referrals",
                  color: "text-green-600 dark:text-green-400",
                  bgColor: "bg-green-50 dark:bg-green-950/20",
                  borderColor: "border-green-200 dark:border-green-800",
                },
                {
                  icon: Award,
                  title: "Level Up",
                  description: "Increase your referrals to climb our level system and unlock greater rewards",
                  color: "text-blue-600 dark:text-blue-400",
                  bgColor: "bg-blue-50 dark:bg-blue-950/20",
                  borderColor: "border-blue-200 dark:border-blue-800",
                },
              ].map((item, index) => (
                <Card
                  key={item.title}
                  className={`${item.bgColor} ${item.borderColor} shadow-sm transition-all hover:shadow-md`}
                >
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <CardTitle className="mt-4">
                      <span className="mr-2 inline-block rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        Step {index + 1}
                      </span>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rewards System */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Rewards System</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We believe in generously rewarding our community members. Here's how you can earn with Pounds Bosses.
              </p>
            </div>

            <div className="mt-16 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-bold">Referral Rewards</h3>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>₦3,500</strong> for each person who signs up using your coupon code
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>₦200</strong> for each person who signs up using your referral link
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>₦5,000</strong> welcome bonus for new users who sign up with a valid coupon code
                    </span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-bold">Investment Returns</h3>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>2.5% daily interest</strong> on your funded account balance
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Interest is automatically added to your available withdrawal balance</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Withdraw your funds at any time with no lock-in period</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Level System */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Level Up Your Status</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                As you grow your network, you'll climb our level system and unlock greater rewards and recognition.
              </p>
            </div>

            <div className="mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                { level: "Fire Starter", refs: "1-5 referrals", color: "from-orange-500 to-red-500" },
                { level: "Growing Legend", refs: "6-10 referrals", color: "from-green-500 to-emerald-600" },
                { level: "Potential Admin", refs: "11-19 referrals", color: "from-blue-500 to-indigo-600" },
                { level: "Admin", refs: "20-30 referrals", color: "from-purple-500 to-violet-600" },
                { level: "Leader", refs: "31-50 referrals", color: "from-indigo-500 to-blue-700" },
                { level: "Legend", refs: "51-100 referrals", color: "from-yellow-500 to-amber-600" },
                { level: "Ultra Legend", refs: "101+ referrals", color: "from-red-500 to-rose-600" },
              ].map((item) => (
                <div
                  key={item.level}
                  className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 transition-opacity group-hover:opacity-10`}
                  ></div>
                  <h3 className="text-xl font-bold">{item.level}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.refs}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-primary py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]"></div>
          <div className="container relative z-10 mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Start Your Journey?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Join thousands of Nigerians who are already building wealth with Pounds Bosses.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-up">
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/get-code">Get Access Code</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-bold">Pounds Bosses</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Turn your network into net worth with Nigeria's premier referral platform.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold">Quick Links</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Legal</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Contact</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="text-muted-foreground">Email: support@poundsbosses.com</li>
                <li className="text-muted-foreground">WhatsApp: +234 708 675 7575</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Pounds Bosses. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

