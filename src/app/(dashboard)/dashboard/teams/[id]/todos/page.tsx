import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TeamTodosClient } from "./team-todos-client"

interface TeamTodosPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamTodosPage({ params }: TeamTodosPageProps) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  return <TeamTodosClient teamId={id} user={session.user} />
}