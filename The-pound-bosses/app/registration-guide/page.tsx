import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function RegistrationGuidePage() {
  return (
    <div className="container max-w-4xl py-6 lg:py-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <Wallet className="h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">Registration Guide</h1>
        <p className="text-muted-foreground">Follow these steps to complete your registration</p>
      </div>

      <div className="mt-10 space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Dashboard Preview</h2>
            <p className="text-muted-foreground">Here's what your dashboard will look like after registration</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Image
              src="/placeholder.svg?height=200&width=400"
              width={400}
              height={200}
              alt="Dashboard Preview"
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Step-by-Step Guide</h2>
          <div className="grid gap-4">
            {[
              {
                title: "Get Your Access Code",
                content: "Contact an agent via WhatsApp to receive your unique access code.",
              },
              {
                title: "Fill Registration Form",
                content: "Enter your details including username, email, and access code.",
              },
              {
                title: "Verify Email",
                content: "Click the verification link sent to your email.",
              },
              {
                title: "Access Dashboard",
                content: "Log in to access your personalized dashboard and start earning.",
              },
            ].map((step, index) => (
              <div key={step.title} className="flex items-start gap-4 rounded-lg border p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Level System</h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                level: "Fire Starter",
                refs: "1-5 referrals",
                benefits: "Basic commission rates, access to referral tools",
              },
              {
                level: "Growing Legend",
                refs: "6-10 referrals",
                benefits: "Increased commission rates, priority support",
              },
              {
                level: "Potential Admin",
                refs: "11-19 referrals",
                benefits: "Higher earnings, exclusive training materials",
              },
              {
                level: "Admin",
                refs: "20-30 referrals",
                benefits: "Admin privileges, team management tools",
              },
              {
                level: "Leader",
                refs: "31-50 referrals",
                benefits: "Leadership bonuses, mentorship opportunities",
              },
              {
                level: "Legend",
                refs: "51-100 referrals",
                benefits: "Maximum commission rates, exclusive events access",
              },
              {
                level: "Ultra Legend",
                refs: "101+ referrals",
                benefits: "Elite status, special recognition, highest rewards",
              },
            ].map((item, i) => (
              <AccordionItem key={item.level} value={`item-${i}`}>
                <AccordionTrigger>{item.level}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Requirements:</span> {item.refs}
                    </p>
                    <p>
                      <span className="font-semibold">Benefits:</span> {item.benefits}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-in">
              Start Registration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

