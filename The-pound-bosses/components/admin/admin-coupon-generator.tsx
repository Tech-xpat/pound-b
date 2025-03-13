"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAdmin } from "@/lib/admin-context"

export function AdminCouponGenerator() {
  const { user } = useAdmin()
  const [quantity, setQuantity] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const generateCoupons = async () => {
    if (!user) return
    setGenerating(true)
    setError("")
    setSuccess("")

    try {
      const coupons = []
      for (let i = 0; i < quantity; i++) {
        const coupon = {
          code: Math.random().toString(36).substring(2, 10).toUpperCase(),
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          used: false,
        }
        const docRef = await addDoc(collection(db, "coupons"), coupon)
        coupons.push({ id: docRef.id, ...coupon })
      }

      setSuccess(`Successfully generated ${quantity} coupon(s)`)
      console.log("Generated coupons:", coupons)
    } catch (error) {
      console.error("Error generating coupons:", error)
      setError("Failed to generate coupons")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Coupons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number.parseInt(e.target.value))}
            />
          </div>
          <Button onClick={generateCoupons} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Coupons"
            )}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4 bg-green-500/10 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

