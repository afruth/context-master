import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeamsClient } from "./teams-client"

export default async function TeamsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return <TeamsClient user={session.user} />
}