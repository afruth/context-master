'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  UserPlus,
  Users,
  Clock,
  Check,
  X,
  ArrowRight,
  Shield,
  User as UserIcon,
  Eye,
  AlertTriangle,
  Loader2,
  LogIn,
  UserCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { toast } from 'sonner'
import { 
  useInvitationDetails, 
  useAcceptInvitation, 
  useDeclineInvitation 
} from '@/hooks/use-team-invitations'
import { TeamRole } from '@prisma/client'

interface InviteAcceptClientProps {
  token: string
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

const roleDescriptions = {
  ADMIN: 'Full team management permissions',
  MEMBER: 'Create and edit tasks, participate in activities',
  VIEWER: 'View team tasks and activity only',
}

export function InviteAcceptClient({ token }: InviteAcceptClientProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [decision, setDecision] = React.useState<'accept' | 'decline' | null>(null)

  const { 
    data: invitation, 
    isLoading: isLoadingInvitation, 
    error: invitationError 
  } = useInvitationDetails(token)

  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation({
    onSuccess: (data) => {
      toast.success('Welcome to the team!')
      router.push(`/dashboard/teams/${data.team.id}`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept invitation')
      setDecision(null)
    }
  })

  const { mutate: declineInvitation, isPending: isDeclining } = useDeclineInvitation({
    onSuccess: () => {
      toast.success('Invitation declined')
      setDecision('decline')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to decline invitation')
      setDecision(null)
    }
  })

  const handleAccept = () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setDecision('accept')
    acceptInvitation(token)
  }

  const handleDecline = () => {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setDecision('decline')
    declineInvitation(token)
  }

  const isPending = isAccepting || isDeclining

  if (status === 'loading' || isLoadingInvitation) {
    return (
      <AuthLayout>
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    )
  }

  if (invitationError || !invitation) {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            <p className="text-muted-foreground">
              {invitationError?.message || 'This invitation link is not valid or has expired.'}
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The invitation may have been:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>• Expired or cancelled</li>
                  <li>• Already accepted or declined</li>
                  <li>• Invalid or corrupted</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Please contact the person who invited you for a new invitation link.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </AuthLayout>
    )
  }

  // Check if user email matches invitation
  const emailMismatch = session?.user?.email && session.user.email !== invitation.email

  if (decision === 'decline') {
    return (
      <AuthLayout>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <X className="h-8 w-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold">Invitation Declined</h1>
            <p className="text-muted-foreground">
              You have declined the invitation to join <strong>{invitation.team.name}</strong>.
            </p>
          </div>
          
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </AuthLayout>
    )
  }

  const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons] || UserIcon

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">You're Invited!</h1>
          <p className="text-muted-foreground">
            Join <strong>{invitation.team.name}</strong> and start collaborating
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Team Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Info */}
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ backgroundColor: invitation.team.color || '#06b6d4' }}
              >
                {invitation.team.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{invitation.team.name}</h3>
                {invitation.team.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {invitation.team.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {invitation.team.memberCount} members
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Invitation Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Your Role:</span>
                <Badge variant="secondary" className={`${roleColors[invitation.role as keyof typeof roleColors]} flex items-center gap-1`}>
                  <RoleIcon className="h-3 w-3" />
                  {invitation.role}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {roleDescriptions[invitation.role as keyof typeof roleDescriptions]}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Invited by:</span>
                <div className="flex items-center gap-2">
                  <Avatar size="sm" className="w-6 h-6">
                    <AvatarFallback className="text-xs">
                      {invitation.inviter.name?.charAt(0) || invitation.inviter.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{invitation.inviter.name || invitation.inviter.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Expires:</span>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(invitation.expiresAt), 'MMM d, yyyy')}
                </span>
              </div>

              {invitation.message && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Personal Message:</p>
                  <p className="text-sm text-muted-foreground">{invitation.message}</p>
                </div>
              )}
            </div>

            {/* Email Mismatch Warning */}
            {emailMismatch && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800">Email Mismatch</p>
                    <p className="text-xs text-yellow-700">
                      This invitation was sent to <strong>{invitation.email}</strong>, 
                      but you're signed in as <strong>{session?.user?.email}</strong>.
                    </p>
                    <p className="text-xs text-yellow-700">
                      You'll need to sign in with the invited email address to accept.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auth Check */}
            {!session?.user ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to accept this invitation
                </p>
                <Button onClick={() => router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)} className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Accept
                </Button>
                <Button onClick={() => router.push(`/register?callbackUrl=${encodeURIComponent(window.location.pathname)}`)} variant="outline" className="w-full">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Create Account
                </Button>
              </div>
            ) : (
              /* Action Buttons */
              <div className="flex gap-3">
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="flex-1"
                  disabled={isPending || emailMismatch}
                >
                  {isDeclining ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Decline
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1"
                  disabled={isPending || emailMismatch}
                >
                  {isAccepting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept & Join
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  )
}