'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PersonalTodoSummary, ApiResponse, PaginatedResponse } from '@/types/api'
import { useToast } from './use-toast'

// API functions
async function fetchPersonalTodos(params: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  search?: string
}): Promise<PaginatedResponse<PersonalTodoSummary>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value.toString())
  })
  
  const response = await fetch(`/api/todos/personal?${searchParams}`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch todos')
  }
  
  return response.json()
}

async function createPersonalTodo(data: {
  title: string
  description?: string
  priority?: string
  dueDate?: string
  category?: string
  tags?: string[]
}): Promise<PersonalTodoSummary> {
  const response = await fetch('/api/todos/personal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to create todo')
  }
  
  const result: ApiResponse<PersonalTodoSummary> = await response.json()
  return result.data
}

async function updatePersonalTodo(id: string, data: Partial<{
  title: string
  description?: string
  status: string
  priority?: string
  dueDate?: string
  category?: string
  tags?: string[]
}>): Promise<PersonalTodoSummary> {
  const response = await fetch(`/api/todos/personal/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to update todo')
  }
  
  const result: ApiResponse<PersonalTodoSummary> = await response.json()
  return result.data
}

async function deletePersonalTodo(id: string): Promise<void> {
  const response = await fetch(`/api/todos/personal/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete todo')
  }
}

// React Query hooks
export function usePersonalTodos(params: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['todos', 'personal', params],
    queryFn: () => fetchPersonalTodos(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreatePersonalTodo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: createPersonalTodo,
    onSuccess: (newTodo) => {
      // Invalidate and refetch todos
      queryClient.invalidateQueries({ queryKey: ['todos', 'personal'] })
      
      toast({
        title: 'Success',
        description: 'Todo created successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create todo',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdatePersonalTodo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePersonalTodo>[1] }) => 
      updatePersonalTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', 'personal'] })
      
      toast({
        title: 'Success',
        description: 'Todo updated successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update todo',
        variant: 'destructive',
      })
    },
  })
}

export function useDeletePersonalTodo() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: deletePersonalTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos', 'personal'] })
      
      toast({
        title: 'Success',
        description: 'Todo deleted successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete todo',
        variant: 'destructive',
      })
    },
  })
}