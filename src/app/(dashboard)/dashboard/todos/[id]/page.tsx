import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { TodoDetailClient } from "./todo-detail-client"
import type { Metadata } from 'next'

interface TodoDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TodoDetailPageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    const todo = await prisma.personalTodo.findUnique({
      where: { id },
      select: { title: true, description: true }
    })
    
    if (!todo) {
      return { title: 'Todo Not Found' }
    }
    
    return {
      title: `${todo.title} | Personal Todo`,
      description: todo.description || `Details for todo: ${todo.title}`,
    }
  } catch {
    return { title: 'Todo Details' }
  }
}

export default async function TodoDetailPage({ params }: TodoDetailPageProps) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const todo = await prisma.personalTodo.findFirst({
    where: {
      id,
      userId: session.user.id,
      archivedAt: null,
    },
    include: {
      timeEntries: {
        orderBy: { startTime: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          timeEntries: true,
        },
      },
    },
  })

  if (!todo) {
    notFound()
  }

  // Calculate time statistics
  const totalTimeSpent = todo.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  const activeTimeEntry = todo.timeEntries.find(entry => !entry.endTime)

  return (
    <TodoDetailClient 
      todo={{
        ...todo,
        tags: todo.tags ? JSON.parse(todo.tags as string) : [],
        totalTimeSpent,
        activeTimeEntry,
      }}
      user={session.user}
    />
  )
}