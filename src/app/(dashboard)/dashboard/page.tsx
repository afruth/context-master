import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layouts/app-layout"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
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
                <h1 className="text-2xl font-bold">
                  Welcome back, {session.user?.name || 'User'}!
                </h1>
                <p className="text-muted-foreground">
                  Here&apos;s what&apos;s happening with your tasks today.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/todos/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Todo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 space-y-6">
            <DashboardStats />
            
            <div className="grid gap-6 md:grid-cols-2">
              <RecentActivity />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>
                    Manage your productivity with these shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/dashboard/todos">
                    <Button variant="outline" className="w-full justify-between">
                      View All Todos
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/teams">
                    <Button variant="outline" className="w-full justify-between">
                      Manage Teams
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/reports">
                    <Button variant="outline" className="w-full justify-between">
                      View Reports
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/time">
                    <Button variant="outline" className="w-full justify-between">
                      Time Tracking
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}