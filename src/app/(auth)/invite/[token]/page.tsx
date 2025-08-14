import { Metadata } from 'next'
import { InviteAcceptClient } from './invite-accept-client'

interface InvitePageProps {
  params: Promise<{
    token: string
  }>
}

export const metadata: Metadata = {
  title: 'Team Invitation',
  description: 'Accept your team invitation',
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  
  return <InviteAcceptClient token={token} />
}