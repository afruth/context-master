import type { Metadata } from 'next'
import { ProfileClient } from './profile-client'

export const metadata: Metadata = {
  title: 'Profile - Todo App',
  description: 'Manage your account settings, preferences, and profile information',
}

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <ProfileClient />
      </div>
    </div>
  )
}