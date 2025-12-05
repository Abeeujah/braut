import { EventStats } from "@/components/event-stats"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Analytics - De Adonai Funfair",
  description: "View analytics and insights from the De Adonai Funfair event",
}

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1]">
            Event Analytics
          </h1>
          
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Comprehensive insights and statistics from the funfair
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-full transition-opacity duration-200 hover:opacity-80"
            >
              Register new child
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32 space-y-8">
        <EventStats />
        <div className="border border-border rounded-2xl p-6 sm:p-8 bg-card">
          <AnalyticsCharts />
        </div>
      </section>
    </main>
  )
}
