"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Ticket, CheckCircle, Clock, TrendingUp } from "lucide-react"
import type { Database } from "@/types/database"

type Ticket = Database["public"]["Tables"]["tickets"]["Row"]

interface RedemptionStats {
  total: number
  redeemed: number
  active: number
  redemptionRate: number
}

const statConfig = [
  {
    key: "total",
    label: "Total Tickets",
    icon: Ticket,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    key: "redeemed",
    label: "Redeemed",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "active",
    label: "Pending",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    key: "redemptionRate",
    label: "Completion",
    icon: TrendingUp,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    suffix: "%"
  },
]

export function RedemptionStats() {
  const [stats, setStats] = useState<RedemptionStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()
        const { data: tickets } = await supabase.from("tickets").select("*")

        if (tickets) {
          const total = tickets.length
          const redeemed = tickets.filter((t) => t.status === "redeemed").length
          const active = tickets.filter((t) => t.status === "active").length

          setStats({
            total,
            redeemed,
            active,
            redemptionRate: total > 0 ? Math.round((redeemed / total) * 100) : 0,
          })
        }
      } catch (err) {
        console.error("Error fetching stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    const supabase = createClient()
    const channel = supabase
      .channel("tickets-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((config) => {
        const Icon = config.icon
        const value = stats[config.key as keyof RedemptionStats]
        
        return (
          <div
            key={config.key}
            className={`relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor} p-5 transition-all duration-200 hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
                <p className={`font-serif text-3xl ${config.color}`}>
                  {value}{config.suffix || ""}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl bg-white/80 border ${config.borderColor}`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
