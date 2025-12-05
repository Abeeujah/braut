"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Ticket, CheckCircle, TrendingUp } from "lucide-react"
import type { Database } from "@/types/database"

type Child = Database["public"]["Tables"]["children"]["Row"]
type Ticket = Database["public"]["Tables"]["tickets"]["Row"]

interface EventStats {
  totalChildren: number
  totalTickets: number
  redeemedTickets: number
  avgAgeGroup: string
}

const statConfig = [
  {
    key: "totalChildren",
    label: "Total Children",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    key: "totalTickets",
    label: "Total Tickets",
    icon: Ticket,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
  },
  {
    key: "redeemedTickets",
    label: "Redeemed",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  {
    key: "avgAgeGroup",
    label: "Avg Age Group",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
]

export function EventStats() {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()

        const { data: children } = await supabase.from("children").select("*")
        const { data: tickets } = await supabase.from("tickets").select("*")

        if (children && tickets) {
          const redeemedCount = tickets.filter((t) => t.status === "redeemed").length

          const ageSum = (children as Child[]).reduce((sum, child) => sum + child.age, 0)
          const avgAge = children.length > 0 ? Math.round(ageSum / children.length) : 0
          const ageGroup =
            avgAge <= 5 ? "3-5" : avgAge <= 8 ? "6-8" : avgAge <= 11 ? "9-11" : avgAge <= 14 ? "12-14" : "15+"

          setStats({
            totalChildren: children.length,
            totalTickets: tickets.length,
            redeemedTickets: redeemedCount,
            avgAgeGroup: ageGroup,
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
      .channel("event-stats-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "children" }, () => {
        fetchStats()
      })
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map((config) => {
        const Icon = config.icon
        const value = stats[config.key as keyof EventStats]
        
        return (
          <div
            key={config.key}
            className={`relative overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor} p-5 transition-all duration-200 hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
                <p className={`font-serif text-3xl ${config.color}`}>{value}</p>
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
