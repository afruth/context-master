import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PersonalTodosClient } from "./todos-client"

export default async function PersonalTodosPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return <PersonalTodosClient user={session.user} />
}