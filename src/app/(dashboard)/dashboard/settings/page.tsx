import type { Metadata } from 'next'
import { SettingsClient } from './settings-client'

export const metadata: Metadata = {
  title: 'Settings - Todo App',
  description: 'Configure application settings, preferences, and privacy options',
}

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application preferences and settings
          </p>
        </div>
        
        <SettingsClient />
      </div>
    </div>
  )
}