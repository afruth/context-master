'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/components/providers/theme-provider'
import {
  Settings,
  Bell,
  Shield,
  Database,
  Layout,
  Globe,
  Palette,
  Clock,
  Calendar,
  Users,
  Eye,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Save,
  FileText,
  Archive,
  UserCheck,
  Mail,
  Smartphone,
  Timer,
  BarChart3,
  CheckSquare,
  List,
  Columns,
  MonitorSpeaker,
  Volume2,
  Import,
  FileDown,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { ThemeSection } from '@/components/ui/theme-toggle'

// Validation schemas
const applicationPreferencesSchema = z.object({
  defaultTodoPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  defaultDueDateOffset: z.enum(['none', '1-hour', '1-day', '3-days', '1-week', '1-month']),
  autoSaveFrequency: z.enum(['real-time', '30-seconds', '1-minute', '5-minutes']),
  sidebarCollapsed: z.boolean(),
  defaultViewMode: z.enum(['board', 'list']),
  tasksPerPage: z.number().min(5).max(100),
})

const notificationSettingsSchema = z.object({
  emailTaskAssignments: z.boolean(),
  emailTeamInvitations: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigestEmails: z.boolean(),
  dueDateReminders: z.enum(['none', '1-hour', '1-day', '3-days', '1-week']),
  teamActivityNotifications: z.boolean(),
})

const displaySettingsSchema = z.object({
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY']),
  timeFormat: z.enum(['12-hour', '24-hour']),
  firstDayOfWeek: z.enum(['sunday', 'monday']),
  showTimezoneInUI: z.boolean(),
  listSpacing: z.enum(['compact', 'comfortable']),
  showCompletedTasks: z.boolean(),
})

const privacySecuritySchema = z.object({
  profileVisibility: z.enum(['public', 'team-only', 'private']),
  showActivity: z.boolean(),
  showOnlineStatus: z.boolean(),
  emailVisibility: z.enum(['public', 'team-only', 'private']),
  autoLogoutTimeout: z.enum(['never', '15-minutes', '1-hour', '4-hours', '1-day']),
})

// Default values
const DEFAULT_APPLICATION_PREFERENCES = {
  defaultTodoPriority: 'MEDIUM' as const,
  defaultDueDateOffset: '1-day' as const,
  autoSaveFrequency: 'real-time' as const,
  sidebarCollapsed: false,
  defaultViewMode: 'list' as const,
  tasksPerPage: 20,
}

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailTaskAssignments: true,
  emailTeamInvitations: true,
  pushNotifications: false,
  weeklyDigestEmails: true,
  dueDateReminders: '1-day' as const,
  teamActivityNotifications: true,
}

const DEFAULT_DISPLAY_SETTINGS = {
  dateFormat: 'MM/DD/YYYY' as const,
  timeFormat: '12-hour' as const,
  firstDayOfWeek: 'sunday' as const,
  showTimezoneInUI: true,
  listSpacing: 'comfortable' as const,
  showCompletedTasks: false,
}

const DEFAULT_PRIVACY_SECURITY = {
  profileVisibility: 'team-only' as const,
  showActivity: true,
  showOnlineStatus: true,
  emailVisibility: 'team-only' as const,
  autoLogoutTimeout: '1-day' as const,
}

interface UserSettings {
  applicationPreferences: z.infer<typeof applicationPreferencesSchema>
  notificationSettings: z.infer<typeof notificationSettingsSchema>
  displaySettings: z.infer<typeof displaySettingsSchema>
  privacySettings: z.infer<typeof privacySecuritySchema>
}

export function SettingsClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)

  // Form instances
  const applicationForm = useForm<z.infer<typeof applicationPreferencesSchema>>({
    resolver: zodResolver(applicationPreferencesSchema),
    defaultValues: DEFAULT_APPLICATION_PREFERENCES,
  })

  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: DEFAULT_NOTIFICATION_SETTINGS,
  })

  const displayForm = useForm<z.infer<typeof displaySettingsSchema>>({
    resolver: zodResolver(displaySettingsSchema),
    defaultValues: DEFAULT_DISPLAY_SETTINGS,
  })

  const privacyForm = useForm<z.infer<typeof privacySecuritySchema>>({
    resolver: zodResolver(privacySecuritySchema),
    defaultValues: DEFAULT_PRIVACY_SECURITY,
  })

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/users/settings')
        if (!response.ok) {
          throw new Error('Failed to load settings')
        }
        
        const data = await response.json()
        const loadedSettings = data.data
        setSettings(loadedSettings)
        
        // Reset forms with loaded data
        applicationForm.reset(loadedSettings.applicationPreferences || DEFAULT_APPLICATION_PREFERENCES)
        notificationForm.reset(loadedSettings.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS)
        displayForm.reset(loadedSettings.displaySettings || DEFAULT_DISPLAY_SETTINGS)
        privacyForm.reset(loadedSettings.privacySettings || DEFAULT_PRIVACY_SECURITY)
      } catch (error) {
        console.error('Error loading settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        })
        
        // Fallback to default settings
        const defaultSettings: UserSettings = {
          applicationPreferences: DEFAULT_APPLICATION_PREFERENCES,
          notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
          displaySettings: DEFAULT_DISPLAY_SETTINGS,
          privacySettings: DEFAULT_PRIVACY_SECURITY,
        }
        setSettings(defaultSettings)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [applicationForm, notificationForm, displayForm, privacyForm, toast])

  // Save settings via API
  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const response = await fetch('/api/users/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save settings')
    }
    
    const data = await response.json()
    setSettings(data.data)
    return data.data
  }

  // Update application preferences
  const onUpdateApplicationPreferences = async (data: z.infer<typeof applicationPreferencesSchema>) => {
    try {
      setUpdating('application')
      await saveSettings({ applicationPreferences: data })
      toast({
        title: 'Success',
        description: 'Application preferences updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating application preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to update application preferences',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Update notification settings
  const onUpdateNotificationSettings = async (data: z.infer<typeof notificationSettingsSchema>) => {
    try {
      setUpdating('notifications')
      await saveSettings({ notificationSettings: data })
      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Update display settings
  const onUpdateDisplaySettings = async (data: z.infer<typeof displaySettingsSchema>) => {
    try {
      setUpdating('display')
      await saveSettings({ displaySettings: data })
      toast({
        title: 'Success',
        description: 'Display settings updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating display settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update display settings',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Update privacy settings
  const onUpdatePrivacySettings = async (data: z.infer<typeof privacySecuritySchema>) => {
    try {
      setUpdating('privacy')
      await saveSettings({ privacySettings: data })
      toast({
        title: 'Success',
        description: 'Privacy settings updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Data management functions
  const handleExportData = async () => {
    try {
      setUpdating('export')
      
      const response = await fetch('/api/users/settings?action=export', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to export data')
      }
      
      const data = await response.json()
      const exportData = data.data
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `todo-app-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: 'Success',
        description: 'Data exported successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUpdating('import')
      const file = event.target.files?.[0]
      if (!file) return

      const text = await file.text()
      const importedData = JSON.parse(text)
      
      // Validate and apply imported settings
      if (importedData.settings) {
        await saveSettings(importedData.settings)
        
        // Reset forms with imported data
        applicationForm.reset(importedData.settings.applicationPreferences || DEFAULT_APPLICATION_PREFERENCES)
        notificationForm.reset(importedData.settings.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS)
        displayForm.reset(importedData.settings.displaySettings || DEFAULT_DISPLAY_SETTINGS)
        privacyForm.reset(importedData.settings.privacySettings || DEFAULT_PRIVACY_SECURITY)
        
        toast({
          title: 'Success',
          description: 'Data imported successfully',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('Error importing data:', error)
      toast({
        title: 'Error',
        description: 'Failed to import data. Please check the file format.',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handleResetSettings = async () => {
    try {
      setUpdating('reset')
      
      const defaultSettings: UserSettings = {
        applicationPreferences: DEFAULT_APPLICATION_PREFERENCES,
        notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
        displaySettings: DEFAULT_DISPLAY_SETTINGS,
        privacySettings: DEFAULT_PRIVACY_SECURITY,
      }
      
      await saveSettings(defaultSettings)
      
      // Reset all forms
      applicationForm.reset(DEFAULT_APPLICATION_PREFERENCES)
      notificationForm.reset(DEFAULT_NOTIFICATION_SETTINGS)
      displayForm.reset(DEFAULT_DISPLAY_SETTINGS)
      privacyForm.reset(DEFAULT_PRIVACY_SECURITY)
      
      toast({
        title: 'Success',
        description: 'Settings reset to defaults',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleClearCompletedTasks = async () => {
    try {
      setUpdating('clear-completed')
      
      const response = await fetch('/api/users/settings?action=clear-completed', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear completed tasks')
      }
      
      const data = await response.json()
      toast({
        title: 'Success',
        description: data.message || 'Completed tasks cleared successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error clearing completed tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear completed tasks',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleArchiveOldTasks = async () => {
    try {
      setUpdating('archive-old')
      
      const response = await fetch('/api/users/settings?action=archive-old', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to archive old tasks')
      }
      
      const data = await response.json()
      toast({
        title: 'Success',
        description: data.message || 'Old tasks archived successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error archiving old tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive old tasks',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="application" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="application">
          <Settings className="w-4 h-4 mr-2" />
          Application
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="display">
          <Layout className="w-4 h-4 mr-2" />
          Display
        </TabsTrigger>
        <TabsTrigger value="privacy">
          <Shield className="w-4 h-4 mr-2" />
          Privacy
        </TabsTrigger>
        <TabsTrigger value="data">
          <Database className="w-4 h-4 mr-2" />
          Data
        </TabsTrigger>
      </TabsList>

      {/* Application Preferences Tab */}
      <TabsContent value="application" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Preferences</CardTitle>
            <CardDescription>
              Configure default settings for new tasks and application behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...applicationForm}>
              <form onSubmit={applicationForm.handleSubmit(onUpdateApplicationPreferences)} className="space-y-6">
                
                {/* Todo Defaults */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" />
                    Todo Defaults
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="defaultTodoPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Priority</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default priority for new tasks
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={applicationForm.control}
                      name="defaultDueDateOffset"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Due Date Offset</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No default due date</SelectItem>
                              <SelectItem value="1-hour">1 hour from now</SelectItem>
                              <SelectItem value="1-day">1 day from now</SelectItem>
                              <SelectItem value="3-days">3 days from now</SelectItem>
                              <SelectItem value="1-week">1 week from now</SelectItem>
                              <SelectItem value="1-month">1 month from now</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default due date for new tasks
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Interface Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Layout className="w-5 h-5 mr-2" />
                    Interface Preferences
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="autoSaveFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-save Frequency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="real-time">Real-time</SelectItem>
                              <SelectItem value="30-seconds">Every 30 seconds</SelectItem>
                              <SelectItem value="1-minute">Every minute</SelectItem>
                              <SelectItem value="5-minutes">Every 5 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How often to save form changes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={applicationForm.control}
                      name="defaultViewMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default View Mode</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="board">
                                <div className="flex items-center">
                                  <Columns className="w-4 h-4 mr-2" />
                                  Board view
                                </div>
                              </SelectItem>
                              <SelectItem value="list">
                                <div className="flex items-center">
                                  <List className="w-4 h-4 mr-2" />
                                  List view
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Default view for todo lists
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={applicationForm.control}
                      name="sidebarCollapsed"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Sidebar Collapsed by Default</FormLabel>
                            <FormDescription>
                              Start with sidebar minimized
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={applicationForm.control}
                      name="tasksPerPage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tasks Per Page</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={100}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of tasks to show per page in list view
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updating === 'application'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'application' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Application Preferences
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Notification Settings Tab */}
      <TabsContent value="notifications" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onUpdateNotificationSettings)} className="space-y-6">
                
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailTaskAssignments"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Task Assignments</FormLabel>
                            <FormDescription>
                              Email notifications when tasks are assigned to you
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="emailTeamInvitations"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Team Invitations</FormLabel>
                            <FormDescription>
                              Email notifications for team invitations
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="weeklyDigestEmails"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Weekly Digest</FormLabel>
                            <FormDescription>
                              Weekly summary of your productivity and tasks
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Push Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Push Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="pushNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Browser Push Notifications</FormLabel>
                            <FormDescription>
                              Desktop notifications in your browser
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={notificationForm.control}
                      name="teamActivityNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Team Activity</FormLabel>
                            <FormDescription>
                              Notifications for team member activities
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Reminder Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Timer className="w-5 h-5 mr-2" />
                    Reminders
                  </h3>
                  
                  <FormField
                    control={notificationForm.control}
                    name="dueDateReminders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date Reminders</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No reminders</SelectItem>
                            <SelectItem value="1-hour">1 hour before</SelectItem>
                            <SelectItem value="1-day">1 day before</SelectItem>
                            <SelectItem value="3-days">3 days before</SelectItem>
                            <SelectItem value="1-week">1 week before</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When to receive due date reminders
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updating === 'notifications'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'notifications' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Notification Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Display Settings Tab */}
      <TabsContent value="display" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>
              Customize how information is displayed throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...displayForm}>
              <form onSubmit={displayForm.handleSubmit(onUpdateDisplaySettings)} className="space-y-6">
                
                {/* Date & Time Formats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Date & Time Formats
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={displayForm.control}
                      name="dateFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (European)</SelectItem>
                              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                              <SelectItem value="DD MMM YYYY">DD MMM YYYY (Verbose)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How dates are displayed
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={displayForm.control}
                      name="timeFormat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Format</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                              <SelectItem value="24-hour">24-hour</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How times are displayed
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={displayForm.control}
                      name="firstDayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Day of Week</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sunday">Sunday</SelectItem>
                              <SelectItem value="monday">Monday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            First day of the week in calendars
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={displayForm.control}
                      name="showTimezoneInUI"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Show Timezone in UI</FormLabel>
                            <FormDescription>
                              Display timezone information
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* List Display Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <List className="w-5 h-5 mr-2" />
                    List Display Options
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={displayForm.control}
                      name="listSpacing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>List Spacing</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="compact">Compact</SelectItem>
                              <SelectItem value="comfortable">Comfortable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Spacing between list items
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={displayForm.control}
                      name="showCompletedTasks"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Show Completed Tasks by Default</FormLabel>
                            <FormDescription>
                              Include completed tasks in lists
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={updating === 'display'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'display' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Display Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Theme Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Theme & Appearance</CardTitle>
            <CardDescription>
              Customize the application's appearance and theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSection />
          </CardContent>
        </Card>
      </TabsContent>

      {/* Privacy & Security Tab */}
      <TabsContent value="privacy" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security Settings</CardTitle>
            <CardDescription>
              Control your privacy and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...privacyForm}>
              <form onSubmit={privacyForm.handleSubmit(onUpdatePrivacySettings)} className="space-y-6">
                
                {/* Profile Visibility */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Profile Visibility
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={privacyForm.control}
                      name="profileVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Visibility</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="team-only">Team Members Only</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Who can see your profile information
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="emailVisibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Visibility</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="team-only">Team Members Only</SelectItem>
                              <SelectItem value="private">Private</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Who can see your email address
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Activity Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Activity Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={privacyForm.control}
                      name="showActivity"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Allow Others to See Your Activity</FormLabel>
                            <FormDescription>
                              Show your task activity to team members
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={privacyForm.control}
                      name="showOnlineStatus"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Show Online Status</FormLabel>
                            <FormDescription>
                              Let team members see when you're online
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Session Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Session Management
                  </h3>
                  
                  <FormField
                    control={privacyForm.control}
                    name="autoLogoutTimeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-logout Timeout</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="15-minutes">15 minutes</SelectItem>
                            <SelectItem value="1-hour">1 hour</SelectItem>
                            <SelectItem value="4-hours">4 hours</SelectItem>
                            <SelectItem value="1-day">1 day</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Automatically log out after period of inactivity
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={updating === 'privacy'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'privacy' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Privacy Settings
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Data Management Tab */}
      <TabsContent value="data" className="space-y-6">
        
        {/* Data Export/Import */}
        <Card>
          <CardHeader>
            <CardTitle>Data Import & Export</CardTitle>
            <CardDescription>
              Backup, restore, and manage your application data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Export All Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your settings, todos, and team data as JSON
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={handleExportData}
                disabled={updating === 'export'}
              >
                {updating === 'export' ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export Data
              </Button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-muted-foreground">
                  Restore data from a previously exported file
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={updating === 'import'}
                />
                <Button variant="outline" disabled={updating === 'import'}>
                  {updating === 'import' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Import Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle>Data Cleanup</CardTitle>
            <CardDescription>
              Manage and clean up your task data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Clear Completed Tasks */}
            <div className="flex items-center justify-between p-4 border border-warning/20 rounded-lg bg-warning/5">
              <div className="space-y-1">
                <h4 className="font-medium">Clear All Completed Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently remove all completed tasks from your lists
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Clear Completed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Completed Tasks</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all completed tasks. This action cannot be undone.
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleClearCompletedTasks}
                      className="bg-warning text-warning-foreground hover:bg-warning/90"
                    >
                      Clear Completed Tasks
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Archive Old Tasks */}
            <div className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="space-y-1">
                <h4 className="font-medium">Archive Old Tasks</h4>
                <p className="text-sm text-muted-foreground">
                  Move tasks older than 90 days to archive (reversible)
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={handleArchiveOldTasks}
                disabled={updating === 'archive-old'}
              >
                {updating === 'archive-old' ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Archive className="w-4 h-4 mr-2" />
                )}
                Archive Old Tasks
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Settings Management */}
        <Card>
          <CardHeader>
            <CardTitle>Settings Management</CardTitle>
            <CardDescription>
              Reset and manage your application settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Reset Settings */}
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="space-y-1">
                <h4 className="font-medium">Reset All Settings</h4>
                <p className="text-sm text-muted-foreground">
                  Reset all application settings to their default values
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Settings
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset All Settings</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all your application preferences, notification settings, 
                      display options, and privacy settings to their default values. 
                      Your tasks and teams will not be affected.
                      Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleResetSettings}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reset All Settings
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}