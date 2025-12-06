import { createClient } from "@/lib/supabase/server"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Registrars - De Adonai Funfair",
  description: "View all registrars and their registration statistics",
}

export default async function RegistrarsPage() {
  const supabase = await createClient()

  const { data: registrars } = await supabase
    .from("registrars")
    .select("id, name, email, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  const { data: children } = await supabase
    .from("children")
    .select("registered_by")

  const registrationCounts = (children || []).reduce((acc, child) => {
    if (child.registered_by) {
      acc[child.registered_by] = (acc[child.registered_by] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  const totalRegistrations = children?.length || 0

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-foreground tracking-tight leading-[1.1]">
            Registrars
          </h1>

          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Team members who registered children for the funfair
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

      {/* Stats Overview */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-6 bg-card text-center">
            <p className="text-3xl font-bold text-foreground">{registrars?.length || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Registrars</p>
          </div>
          <div className="border border-border rounded-xl p-6 bg-card text-center">
            <p className="text-3xl font-bold text-foreground">{totalRegistrations}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Registrations</p>
          </div>
        </div>
      </section>

      {/* Registrars List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="border border-border rounded-2xl bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
            <div className="col-span-4">Name</div>
            <div className="col-span-5">Email</div>
            <div className="col-span-3 text-right">Registrations</div>
          </div>

          {registrars && registrars.length > 0 ? (
            <div className="divide-y divide-border">
              {registrars.map((registrar) => {
                const count = registrationCounts[registrar.id] || 0
                return (
                  <div
                    key={registrar.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-4 font-medium text-foreground truncate">
                      {registrar.name}
                    </div>
                    <div className="col-span-5 text-muted-foreground truncate">
                      {registrar.email}
                    </div>
                    <div className="col-span-3 text-right">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 bg-foreground text-background text-sm font-medium rounded-full">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-muted-foreground">
              No registrars found
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
