import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Login - De Adonai Funfair",
  description: "Login to register children for the funfair",
}

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/")
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl text-foreground">Registrar Login</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to register children for the funfair
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
