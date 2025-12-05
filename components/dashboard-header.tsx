"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getHouseStats } from "@/lib/utils/house-assignment"
import { Heart, Smile, Star, Leaf } from "lucide-react"
import type { Database } from "@/types/database"

type Child = Database["public"]["Tables"]["children"]["Row"]

const houseConfig = [
  { 
    name: "Love", 
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  { 
    name: "Joy", 
    icon: Smile,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  { 
    name: "Hope", 
    icon: Star,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  { 
    name: "Peace", 
    icon: Leaf,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
]

export function DashboardHeader() {
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient()
        const { data: children } = await supabase.from("children").select("*")

        if (children) {
          const houseStats = getHouseStats(children)
          setStats(houseStats)
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
      .channel("children-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "children" }, () => {
        fetchStats()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const totalChildren = Object.values(stats).reduce((sum, house) => sum + (house.total || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <p className="text-sm text-muted-foreground">Total Registered</p>
        <span className="font-serif text-3xl text-foreground">{totalChildren}</span>
      </div>

      <div className="space-y-3">
        {houseConfig.map((house) => {
          const Icon = house.icon
          const houseData = stats[house.name]
          const percentage = totalChildren > 0 ? Math.round((houseData.total / totalChildren) * 100) : 0
          
          return (
            <div 
              key={house.name} 
              className={`relative overflow-hidden rounded-xl border ${house.borderColor} ${house.bgColor} p-4 transition-all duration-200 hover:shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/80 border ${house.borderColor}`}>
                    <Icon className={`w-4 h-4 ${house.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{house.name}</p>
                    <p className="text-xs text-muted-foreground">
                      M:{houseData.male} · F:{houseData.female}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-serif text-2xl ${house.color}`}>{houseData.total}</p>
                  <p className="text-xs text-muted-foreground">{percentage}%</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 h-1 rounded-full bg-white/80 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${house.bgColor.replace('50', '400')} opacity-60 transition-all duration-500`}
                  style={{ width: `${percentage}%`, backgroundColor: house.color.includes('rose') ? '#e11d48' : house.color.includes('amber') ? '#d97706' : house.color.includes('blue') ? '#2563eb' : '#059669' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
