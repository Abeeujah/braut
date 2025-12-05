"use client"

import type React from "react"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, Camera } from "lucide-react"
import type { Database } from "@/types/database"

type Ticket = Database["public"]["Tables"]["tickets"]["Row"]
type Child = Database["public"]["Tables"]["children"]["Row"]

interface RedemptionResult {
  success: boolean
  message: string
  ticket?: Ticket
  child?: Child
}

export function RedemptionScanner() {
  const [ticketNumber, setTicketNumber] = useState("")
  const [result, setResult] = useState<RedemptionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentRedemptions, setRecentRedemptions] = useState<Array<{ ticket: Ticket; child: Child }>>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRedeem = async (number: string) => {
    if (!number.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const supabase = createClient()

      // Find the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("ticket_number", number.trim())
        .single()

      if (ticketError || !ticket) {
        setResult({
          success: false,
          message: "Ticket not found. Please check the ticket number.",
        })
        return
      }

      // Check if already redeemed
      if (ticket.status === "redeemed") {
        setResult({
          success: false,
          message: "This ticket has already been redeemed.",
          ticket,
        })
        return
      }

      if (ticket.status === "void") {
        setResult({
          success: false,
          message: "This ticket is invalid.",
          ticket,
        })
        return
      }

      // Get child info
      const { data: child, error: childError } = await supabase
        .from("children")
        .select("*")
        .eq("id", ticket.child_id)
        .single()

      if (childError || !child) {
        setResult({
          success: false,
          message: "Child information not found.",
          ticket,
        })
        return
      }

      // Mark ticket as redeemed
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", ticket.id)

      if (updateError) throw updateError

      setResult({
        success: true,
        message: `Welcome ${child.name}! Ticket redeemed successfully.`,
        ticket: { ...ticket, status: "redeemed", redeemed_at: new Date().toISOString() },
        child,
      })

      // Add to recent redemptions
      setRecentRedemptions((prev) => [{ ticket: { ...ticket, status: "redeemed" }, child }, ...prev].slice(0, 5))

      setTicketNumber("")
      if (inputRef.current) {
        inputRef.current.focus()
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "An error occurred during redemption",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleRedeem(ticketNumber)
  }

  const getHouseColor = (house: string | null) => {
    const colors: Record<string, string> = {
      Love: "bg-red-50 border-red-200 text-red-700",
      Joy: "bg-yellow-50 border-yellow-200 text-yellow-700",
      Hope: "bg-blue-50 border-blue-200 text-blue-700",
      Peace: "bg-green-50 border-green-200 text-green-700",
    }
    return colors[house || "Love"] || "bg-gray-50 border-gray-200"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Ticket Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket">Enter Ticket Number or Scan QR Code</Label>
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  id="ticket"
                  placeholder="FUN..."
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !ticketNumber.trim()}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    "Redeem"
                  )}
                </Button>
              </div>
            </div>

            {result && (
              <div
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                    {result.message}
                  </p>
                  {result.child && (
                    <div className="mt-2 text-sm space-y-1">
                      <p className={result.success ? "text-green-700" : "text-red-700"}>Name: {result.child.name}</p>
                      <p className={result.success ? "text-green-700" : "text-red-700"}>House: {result.child.house}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {recentRedemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRedemptions.map((item) => (
                <div
                  key={item.ticket.id}
                  className={`p-3 rounded-lg border-2 flex items-center justify-between ${getHouseColor(
                    item.child.house,
                  )}`}
                >
                  <div>
                    <p className="font-semibold">{item.child.name}</p>
                    <p className="text-sm opacity-75">House {item.child.house}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">{new Date(item.ticket.redeemed_at || "").toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
