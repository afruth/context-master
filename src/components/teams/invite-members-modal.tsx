'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, Mail, UserPlus, X, Send, Copy, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useSendInvitation } from '@/hooks/use-team-invitations'
import { TeamRole } from '@prisma/client'

const inviteFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'] as const).default('MEMBER'),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface InviteMembersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string
  teamName: string
  teamColor?: string | null
}

const roleDescriptions: Record<Exclude<TeamRole, 'OWNER'>, string> = {
  ADMIN: 'Can manage team settings, invite members, and manage all tasks',
  MEMBER: 'Can create and edit tasks, participate in team activities',
  VIEWER: 'Can view team tasks and activity, but cannot edit or create'
}

const roleColors: Record<Exclude<TeamRole, 'OWNER'>, string> = {
  ADMIN: 'bg-blue-100 text-blue-800',
  MEMBER: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800'
}

export function InviteMembersModal({
  open,
  onOpenChange,
  teamId,
  teamName,
  teamColor
}: InviteMembersModalProps) {
  const [step, setStep] = React.useState<'form' | 'success'>('form')
  const [invitationLink, setInvitationLink] = React.useState<string>('')

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      role: 'MEMBER',
      email: '',
      message: '',
    },
  })

  const { mutate: sendInvitation, isPending } = useSendInvitation({
    onSuccess: (data) => {
      setInvitationLink(`${window.location.origin}/invite/${data.token}`)
      setStep('success')
      toast.success('Invitation sent successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation')
    }
  })

  const onSubmit = (values: InviteFormValues) => {
    sendInvitation({
      teamId,
      data: values
    })
  }

  const copyInvitationLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink)
      toast.success('Invitation link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form and step after a short delay to avoid flash
    setTimeout(() => {
      setStep('form')
      form.reset()
      setInvitationLink('')
    }, 200)
  }

  const sendAnotherInvitation = () => {
    setStep('form')
    form.reset()
    setInvitationLink('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: teamColor || '#06b6d4' }}
                >
                  {teamName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite Team Members
                  </DialogTitle>
                  <DialogDescription>
                    Invite people to join <strong>{teamName}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Enter email address"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleDescriptions).map(([role, description]) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={roleColors[role as keyof typeof roleColors]}>
                                  {role}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {roleDescriptions[field.value as keyof typeof roleDescriptions]}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message <span className="text-muted-foreground">(Optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add a personal message to your invitation..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This message will be included in the invitation email.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <UserPlus className="h-5 w-5" />
                Invitation Sent!
              </DialogTitle>
              <DialogDescription>
                Your invitation has been sent successfully.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Invitation sent to: <strong>{form.getValues('email')}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className={roleColors[form.getValues('role')]}>
                        {form.getValues('role')}
                      </Badge>
                      Role assigned
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Share Invitation Link</h4>
                <p className="text-xs text-muted-foreground">
                  You can also share this direct link with the person you're inviting:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyInvitationLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a href={invitationLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={sendAnotherInvitation}>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Another
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}