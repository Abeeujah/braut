import { TicketsGalleryClient } from "@/components/tickets-gallery-client"
import { getTicketsPage, type SortField, type SortDir } from "@/lib/tickets/queries"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Generated Tickets - De Adonai Funfair",
  description: "View and download generated tickets for all registered children",
}

interface PageProps {
  searchParams: Promise<{
    page?: string
    q?: string
    sort?: string
    dir?: string
    house?: string
  }>
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const params = await searchParams
  
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = 20
  const sortField = (params.sort as SortField) || "created_at"
  const sortDir = (params.dir as SortDir) || "desc"
  const search = params.q || ""
  const house = params.house || ""

  const { rows, total } = await getTicketsPage({
    page,
    pageSize,
    search,
    sortField,
    sortDir,
    house,
  })

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1]">
            Generated Tickets
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            View and download tickets for all registered children
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="border border-border rounded-2xl p-6 sm:p-8 bg-card">
          <TicketsGalleryClient
            children={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            sortField={sortField}
            sortDir={sortDir}
            search={search}
            house={house}
          />
        </div>
      </section>
    </main>
  )
}
