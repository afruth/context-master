import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { ReportsClient } from "./reports-client"

export default async function ReportsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <AppLayout user={session.user}>
      <div className="flex flex-col h-full">
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                <p className="text-muted-foreground">
                  Analyze your productivity and track your progress across personal and team work.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            <ReportsClient />
          </div>
        </main>
      </div>
    </AppLayout>
  )
}