import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NewTeamClient } from "./new-team-client"

export default async function NewTeamPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return <NewTeamClient user={session.user} />
}