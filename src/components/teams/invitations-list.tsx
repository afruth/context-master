'use client'

import * as React from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Mail, 
  Clock, 
  RotateCcw, 
  X, 
  MoreHorizontal,
  Copy,
  ExternalLink,
  AlertTriangle,
  Crown,
  Shield,
  User as UserIcon,
  Eye
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useTeamInvitations, useCancelInvitation, useResendInvitation } from '@/hooks/use-team-invitations'
import { TeamInvitationWithInviter } from '@/types/api'
import { TeamRole } from '@prisma/client'

interface InvitationsListProps {
  teamId: string
  canManage: boolean
}

const roleIcons = {
  ADMIN: Shield,
  MEMBER: UserIcon,
  VIEWER: Eye,
}

const roleColors = {
  ADMIN: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  EXPIRED: 'bg-red-100 text-red-800',
}

interface InvitationCardProps {
  invitation: TeamInvitationWithInviter
  canManage: boolean
  onCancel: (id: string) => void
  onResend: (id: string) => void
}

function InvitationCard({ invitation, canManage, onCancel, onResend }: InvitationCardProps) {
  const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons] || UserIcon
  const isExpired = invitation.expiresAt < new Date()
  const status = isExpired ? 'EXPIRED' : invitation.status

  const copyInvitationLink = async () => {
    try {
      const link = `${window.location.origin}/invite/${invitation.token}`
      await navigator.clipboard.writeText(link)
      toast.success('Invitation link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const openInvitationLink = () => {
    const link = `${window.location.origin}/invite/${invitation.token}`
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">{invitation.email}</p>
                <Badge 
                  variant="secondary" 
                  className={`flex items-center gap-1 ${roleColors[invitation.role as keyof typeof roleColors]}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {invitation.role}
                </Badge>
                <Badge variant="secondary" className={statusColors[status as keyof typeof statusColors]}>
                  {status}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    Invited by <strong>{invitation.inviter.name || invitation.inviter.email}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                  </div>
                </div>
                
                <div>
                  Expires: {format(new Date(invitation.expiresAt), 'MMM d, yyyy at h:mm a')}
                </div>
                
                {invitation.message && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <strong>Message:</strong> {invitation.message}
                  </div>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center gap-1 ml-2">
              {invitation.status === 'PENDING' && !isExpired && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResend(invitation.id)}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Resend
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyInvitationLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Invitation Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openInvitationLink}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Invitation
                  </DropdownMenuItem>
                  {invitation.status === 'PENDING' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onResend(invitation.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Resend Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onCancel(invitation.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Invitation
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function InvitationsList({ teamId, canManage }: InvitationsListProps) {
  const { data: invitationsData, isLoading, error } = useTeamInvitations(teamId)
  
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation({
    onSuccess: () => {
      toast.success('Invitation cancelled successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel invitation')
    }
  })

  const { mutate: resendInvitation, isPending: isResending } = useResendInvitation({
    onSuccess: () => {
      toast.success('Invitation resent successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to resend invitation')
    }
  })

  const handleCancel = (invitationId: string) => {
    cancelInvitation({ teamId, invitationId })
  }

  const handleResend = (invitationId: string) => {
    resendInvitation({ teamId, invitationId })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load invitations</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const invitations = invitationsData?.data || []
  const pendingInvitations = invitations.filter(inv => inv.status === 'PENDING')
  const expiredInvitations = invitations.filter(inv => 
    inv.status === 'EXPIRED' || inv.expiresAt < new Date()
  )

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2" />
            <p>No pending invitations</p>
            <p className="text-sm">Team invitations will appear here when sent.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Pending Invitations ({pendingInvitations.length})
            </h3>
          </div>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                canManage={canManage}
                onCancel={handleCancel}
                onResend={handleResend}
              />
            ))}
          </div>
        </div>
      )}

      {expiredInvitations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Expired Invitations ({expiredInvitations.length})
            </h3>
          </div>
          <div className="space-y-3">
            {expiredInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                canManage={canManage}
                onCancel={handleCancel}
                onResend={handleResend}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}