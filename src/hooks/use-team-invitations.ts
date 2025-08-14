'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { TeamInvitationWithInviter, CreateInvitationRequest, PaginatedResponse } from '@/types/api'

// API Functions
async function fetchTeamInvitations(teamId: string, params?: { page?: number; limit?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const response = await fetch(`/api/teams/${teamId}/invitations?${searchParams}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch invitations')
  }
  return response.json() as Promise<PaginatedResponse<TeamInvitationWithInviter>>
}

async function sendTeamInvitation(teamId: string, data: CreateInvitationRequest) {
  const response = await fetch(`/api/teams/${teamId}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send invitation')
  }
  return response.json()
}

async function cancelInvitation(teamId: string, invitationId: string) {
  const response = await fetch(`/api/teams/${teamId}/invitations/${invitationId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel invitation')
  }
  return response.json()
}

async function resendInvitation(teamId: string, invitationId: string) {
  const response = await fetch(`/api/teams/${teamId}/invitations/${invitationId}/resend`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to resend invitation')
  }
  return response.json()
}

async function getInvitationDetails(token: string) {
  const response = await fetch(`/api/invitations/${token}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get invitation details')
  }
  return response.json()
}

async function acceptInvitation(token: string) {
  const response = await fetch(`/api/invitations/${token}/accept`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to accept invitation')
  }
  return response.json()
}

async function declineInvitation(token: string) {
  const response = await fetch(`/api/invitations/${token}/decline`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to decline invitation')
  }
  return response.json()
}

// Hooks
export function useTeamInvitations(
  teamId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ['team-invitations', teamId, params],
    queryFn: () => fetchTeamInvitations(teamId, params),
    enabled: !!teamId,
  })
}

export function useSendInvitation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: CreateInvitationRequest }) =>
      sendTeamInvitation(teamId, data),
    onSuccess: (data, variables) => {
      // Invalidate team invitations
      queryClient.invalidateQueries({ 
        queryKey: ['team-invitations', variables.teamId] 
      })
      
      // Invalidate team data to update stats
      queryClient.invalidateQueries({ 
        queryKey: ['team', variables.teamId] 
      })
      
      onSuccess?.(data)
    },
    onError,
  })
}

export function useCancelInvitation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, invitationId }: { teamId: string; invitationId: string }) =>
      cancelInvitation(teamId, invitationId),
    onSuccess: (_, variables) => {
      // Invalidate team invitations
      queryClient.invalidateQueries({ 
        queryKey: ['team-invitations', variables.teamId] 
      })
      
      onSuccess?.()
    },
    onError,
  })
}

export function useResendInvitation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, invitationId }: { teamId: string; invitationId: string }) =>
      resendInvitation(teamId, invitationId),
    onSuccess: (_, variables) => {
      // Invalidate team invitations
      queryClient.invalidateQueries({ 
        queryKey: ['team-invitations', variables.teamId] 
      })
      
      onSuccess?.()
    },
    onError,
  })
}

export function useInvitationDetails(token: string) {
  return useQuery({
    queryKey: ['invitation-details', token],
    queryFn: () => getInvitationDetails(token),
    enabled: !!token,
    retry: false, // Don't retry on 404/400 errors
  })
}

export function useAcceptInvitation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
} = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptInvitation,
    onSuccess: (data) => {
      // Invalidate user teams
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      
      // Invalidate team data
      if (data.data?.team?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['team', data.data.team.id] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['team-members', data.data.team.id] 
        })
      }
      
      onSuccess?.(data.data)
    },
    onError,
  })
}

export function useDeclineInvitation({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void
  onError?: (error: Error) => void
} = {}) {
  return useMutation({
    mutationFn: declineInvitation,
    onSuccess,
    onError,
  })
}