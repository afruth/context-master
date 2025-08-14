import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NewTodoClient } from "./new-todo-client"

export default async function NewTodoPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return <NewTodoClient user={session.user} />
}