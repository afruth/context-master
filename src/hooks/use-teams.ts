'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamWithStats, TeamDetails, TeamMemberWithUser, TeamTodoSummary, TodoCommentWithUser, ApiResponse, PaginatedResponse } from '@/types/api'
import { useToast } from './use-toast'

// API functions
async function fetchTeams(params: {
  page?: number
  limit?: number
} = {}): Promise<PaginatedResponse<TeamWithStats>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value.toString())
  })
  
  const response = await fetch(`/api/teams?${searchParams}`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch teams')
  }
  
  return response.json()
}

async function fetchTeam(id: string): Promise<TeamDetails> {
  const response = await fetch(`/api/teams/${id}`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch team')
  }
  
  const result: ApiResponse<TeamDetails> = await response.json()
  return result.data
}

async function createTeam(data: {
  name: string
  description?: string
  isPublic?: boolean
  color?: string
}): Promise<TeamWithStats> {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create team')
  }
  
  const result: ApiResponse<TeamWithStats> = await response.json()
  return result.data
}

async function updateTeam(id: string, data: {
  name?: string
  description?: string
  isPublic?: boolean
  color?: string
}): Promise<TeamWithStats> {
  const response = await fetch(`/api/teams/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to update team')
  }
  
  const result: ApiResponse<TeamWithStats> = await response.json()
  return result.data
}

async function deleteTeam(id: string): Promise<void> {
  const response = await fetch(`/api/teams/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete team')
  }
}

// React Query hooks
export function useTeams(params: {
  page?: number
  limit?: number
} = {}) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => fetchTeams(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => fetchTeam(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: createTeam,
    onSuccess: (newTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      
      toast({
        title: 'Success',
        description: 'Team created successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTeam>[1] }) => 
      updateTeam(id, data),
    onSuccess: (updatedTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['teams', updatedTeam.id] })
      
      toast({
        title: 'Success',
        description: 'Team updated successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update team',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team',
        variant: 'destructive',
      })
    },
  })
}

// Team Members API functions
async function fetchTeamMembers(teamId: string, params: {
  page?: number
  limit?: number
  role?: string
  search?: string
} = {}): Promise<PaginatedResponse<TeamMemberWithUser>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value.toString())
  })
  
  const response = await fetch(`/api/teams/${teamId}/members?${searchParams}`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch team members')
  }
  
  return response.json()
}

// Team Todos API functions
async function fetchTeamTodos(teamId: string, params: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  assigneeId?: string
  search?: string
  sortBy?: string
  sortOrder?: string
} = {}): Promise<PaginatedResponse<TeamTodoSummary>> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, value.toString())
  })
  
  const response = await fetch(`/api/teams/${teamId}/todos?${searchParams}`, {
    credentials: 'include',
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch team todos')
  }
  
  return response.json()
}

// Team Members hooks
export function useTeamMembers(teamId: string, params: {
  page?: number
  limit?: number
  role?: string
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['teams', teamId, 'members', params],
    queryFn: () => fetchTeamMembers(teamId, params),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Team Todos hooks
export function useTeamTodos(teamId: string, params: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  assigneeId?: string
  search?: string
  sortBy?: string
  sortOrder?: string
} = {}) {
  return useQuery({
    queryKey: ['teams', teamId, 'todos', params],
    queryFn: () => fetchTeamTodos(teamId, params),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

// Team Todo mutations
async function createTeamTodo(teamId: string, data: {
  title: string
  description?: string
  priority?: string
  dueDate?: string
  category?: string
  tags?: string[]
  assigneeId?: string
  estimatedMinutes?: number
}): Promise<TeamTodoSummary> {
  const response = await fetch(`/api/teams/${teamId}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create team todo')
  }
  
  const result: ApiResponse<TeamTodoSummary> = await response.json()
  return result.data
}

async function updateTeamTodo(teamId: string, todoId: string, data: Partial<{
  title: string
  description?: string
  status: string
  priority?: string
  dueDate?: string
  category?: string
  tags?: string[]
  assigneeId?: string
  estimatedMinutes?: number
}>): Promise<TeamTodoSummary> {
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update team todo')
  }
  
  const result: ApiResponse<TeamTodoSummary> = await response.json()
  return result.data
}

async function deleteTeamTodo(teamId: string, todoId: string): Promise<void> {
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete team todo')
  }
}

// Team Todo mutation hooks
export function useCreateTeamTodo(teamId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createTeamTodo>[1]) => 
      createTeamTodo(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] })
      
      toast({
        title: 'Success',
        description: 'Team todo created successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create team todo',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTeamTodo(teamId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ todoId, data }: { todoId: string; data: Parameters<typeof updateTeamTodo>[2] }) => 
      updateTeamTodo(teamId, todoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] })
      
      toast({
        title: 'Success',
        description: 'Team todo updated successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update team todo',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteTeamTodo(teamId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (todoId: string) => deleteTeamTodo(teamId, todoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos'] })
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] })
      
      toast({
        title: 'Success',
        description: 'Team todo deleted successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete team todo',
        variant: 'destructive',
      })
    },
  })
}

// Todo Comments API functions
async function fetchTodoComments(teamId: string, todoId: string, params: {
  page?: number
  limit?: number
} = {}): Promise<PaginatedResponse<TodoComment>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', params.page.toString())
  if (params.limit) searchParams.set('limit', params.limit.toString())
  
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}/comments?${searchParams}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch comments')
  }
  
  return response.json()
}

async function createTodoComment(teamId: string, todoId: string, data: {
  content: string
}): Promise<TodoComment> {
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create comment')
  }
  
  const result = await response.json()
  return result.data
}

async function updateTodoComment(teamId: string, todoId: string, commentId: string, data: {
  content: string
}): Promise<TodoComment> {
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update comment')
  }
  
  const result = await response.json()
  return result.data
}

async function deleteTodoComment(teamId: string, todoId: string, commentId: string): Promise<void> {
  const response = await fetch(`/api/teams/${teamId}/todos/${todoId}/comments/${commentId}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete comment')
  }
}

// Todo Comments React Query hooks
export function useTodoComments(teamId: string, todoId: string, params: {
  page?: number
  limit?: number
} = {}) {
  return useQuery({
    queryKey: ['teams', teamId, 'todos', todoId, 'comments', params],
    queryFn: () => fetchTodoComments(teamId, todoId, params),
    enabled: !!teamId && !!todoId,
  })
}

export function useCreateTodoComment(teamId: string, todoId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (data: { content: string }) => 
      createTodoComment(teamId, todoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos', todoId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos'] }) // Refresh comment counts
      
      toast({
        title: 'Success',
        description: 'Comment added successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTodoComment(teamId: string, todoId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: { content: string } }) => 
      updateTodoComment(teamId, todoId, commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos', todoId, 'comments'] })
      
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteTodoComment(teamId: string, todoId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (commentId: string) => 
      deleteTodoComment(teamId, todoId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos', todoId, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'todos'] }) // Refresh comment counts
      
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
        variant: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      })
    },
  })
}