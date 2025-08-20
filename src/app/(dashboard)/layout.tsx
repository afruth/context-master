import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Providers } from "@/components/providers"
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <Providers session={session}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </Providers>
  )
}