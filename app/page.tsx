import { DashboardHeader } from "@/components/dashboard-header"
import { RegistrationForm } from "@/components/registration-form"
import { ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Registration - De Adonai Funfair",
  description: "Register your child for the annual De Adonai Christmas funfair experience.",
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-foreground tracking-tight leading-[1.1]">
            Register for De Adonai
            <br />
            Christmas Funfair
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Annual Christmas funfair by De Adonai Publishers & Gerizim Studios. 
            Thrills, joys, and unforgettable moments for children and families.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-medium rounded-full transition-opacity duration-200 hover:opacity-80"
            >
              Register now
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 px-6 py-3 text-foreground font-medium transition-opacity duration-200 hover:opacity-60"
            >
              View tickets
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="register" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
                New Registration
              </h2>
              <p className="mt-2 text-muted-foreground">
                Add a child to the funfair event
              </p>
            </div>
            <RegistrationForm />
          </div>

          {/* Dashboard */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
                Houses
              </h2>
              <p className="mt-2 text-muted-foreground">
                Live distribution stats
              </p>
            </div>
            <DashboardHeader />
          </div>
        </div>
      </section>
    </main>
  )
}
