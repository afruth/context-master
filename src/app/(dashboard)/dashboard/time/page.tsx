import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppLayout } from "@/components/layouts/app-layout"
import { TimeTrackingClient } from "./time-tracking-client"

export default async function TimeTrackingPage() {
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
                <h1 className="text-2xl font-bold">Time Tracking</h1>
                <p className="text-muted-foreground">
                  Track time on your todos and monitor productivity
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            <TimeTrackingClient userId={session.user.id!} />
          </div>
        </main>
      </div>
    </AppLayout>
  )
}