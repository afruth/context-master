import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeamDashboardClient } from "./team-dashboard-client"

interface TeamDashboardPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamDashboardPage({ params }: TeamDashboardPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  return <TeamDashboardClient teamId={id} user={session.user} />
}