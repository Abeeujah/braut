import { RedemptionScanner } from "@/components/redemption-scanner"
import { RedemptionStats } from "@/components/redemption-stats"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Ticket Redemption - De Adonai Funfair",
  description: "Redeem tickets during gift distribution",
}

export default function RedemptionPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1]">
            Ticket Redemption
          </h1>
          
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Scan or enter ticket numbers to redeem gifts during the event
          </p>

          <div className="mt-8">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-full transition-opacity duration-200 hover:opacity-80"
            >
              View all tickets
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32 space-y-8">
        <RedemptionStats />
        <div className="border border-border rounded-2xl p-6 sm:p-8 bg-card">
          <RedemptionScanner />
        </div>
      </section>
    </main>
  )
}
