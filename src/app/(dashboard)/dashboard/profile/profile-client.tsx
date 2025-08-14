'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import {
  User,
  Settings,
  Shield,
  BarChart3,
  Calendar,
  Globe,
  Bell,
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  AlertTriangle,
  Mail,
  Clock,
  Users,
  CheckSquare,
  Trophy,
  Palette,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { PasswordStrength } from '@/components/ui/password-strength'

// Validation schemas
const profileInfoSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  username: z.string().max(50, 'Username must be less than 50 characters').optional(),
  email: z.string().email('Invalid email format'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'Password must contain at least one letter and one number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const preferencesSchema = z.object({
  timezone: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  notifications: z.boolean(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyDigest: z.boolean(),
})

// Timezone options
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Osaka, Sapporo' },
  { value: 'Asia/Shanghai', label: 'Beijing, Shanghai' },
  { value: 'Asia/Kolkata', label: 'Mumbai, Kolkata, New Delhi' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne' },
]

// Language options
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

interface UserProfile {
  id: string
  email: string
  username?: string
  name?: string
  image?: string
  timezone: string
  theme: string
  notifications: boolean
  language: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

interface UserStats {
  totalPersonalTodos: number
  completedPersonalTodos: number
  totalTeams: number
  totalTeamTodos: number
  totalTimeSpent: number // in minutes
  completedThisMonth: number
  productivity: number // percentage
}

export function ProfileClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form instances
  const profileForm = useForm<z.infer<typeof profileInfoSchema>>({
    resolver: zodResolver(profileInfoSchema),
  })

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
  })

  const preferencesForm = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
  })

  // Load user profile and stats
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true)
        
        // Load user profile
        const profileResponse = await fetch('/api/users/me')
        if (!profileResponse.ok) {
          throw new Error('Failed to load profile')
        }
        const profileData = await profileResponse.json()
        setUser(profileData.data)
        
        // Set form default values
        profileForm.reset({
          name: profileData.data.name || '',
          username: profileData.data.username || '',
          email: profileData.data.email,
        })
        
        preferencesForm.reset({
          timezone: profileData.data.timezone || 'UTC',
          theme: profileData.data.theme || 'system',
          language: profileData.data.language || 'en',
          notifications: profileData.data.notifications || true,
          emailNotifications: true, // TODO: Get from user preferences
          pushNotifications: false, // TODO: Get from user preferences
          weeklyDigest: true, // TODO: Get from user preferences
        })
        
        // Load user statistics
        const statsResponse = await fetch('/api/users/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data)
        } else {
          console.warn('Failed to load user statistics')
          // Fallback to mock data
          setStats({
            totalPersonalTodos: 0,
            completedPersonalTodos: 0,
            totalTeams: 0,
            totalTeamTodos: 0,
            totalTimeSpent: 0,
            completedThisMonth: 0,
            productivity: 0,
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [profileForm, preferencesForm])

  // Update profile information
  const onUpdateProfile = async (data: z.infer<typeof profileInfoSchema>) => {
    try {
      setUpdating('profile')
      
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          username: data.username,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }
      
      const updatedUser = await response.json()
      setUser(updatedUser.data)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Change password
  const onChangePassword = async (data: z.infer<typeof changePasswordSchema>) => {
    try {
      setUpdating('password')
      
      // TODO: Create change password API endpoint
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to change password')
      }
      
      passwordForm.reset()
      toast({
        title: 'Success',
        description: 'Password changed successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change password',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Update preferences
  const onUpdatePreferences = async (data: z.infer<typeof preferencesSchema>) => {
    try {
      setUpdating('preferences')
      
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone: data.timezone,
          theme: data.theme,
          language: data.language,
          notifications: data.notifications,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update preferences')
      }
      
      const updatedUser = await response.json()
      setUser(updatedUser.data)
      toast({
        title: 'Success',
        description: 'Preferences updated successfully',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update preferences',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Handle account deactivation
  const handleDeactivateAccount = async () => {
    try {
      setUpdating('deactivate')
      
      // TODO: Create account deactivation API endpoint
      toast({
        title: 'Success',
        description: 'Account deactivation request submitted',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error deactivating account:', error)
      toast({
        title: 'Error',
        description: 'Failed to deactivate account',
        variant: 'destructive',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Handle data export
  const handleExportData = async () => {
    try {
      setUpdating('export')
      
      // TODO: Create data export API endpoint
      toast({
        title: 'Export Started',
        description: 'You will receive an email when ready.',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Failed to load profile data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">
          <User className="w-4 h-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="preferences">
          <Settings className="w-4 h-4 mr-2" />
          Preferences
        </TabsTrigger>
        <TabsTrigger value="security">
          <Shield className="w-4 h-4 mr-2" />
          Security
        </TabsTrigger>
        <TabsTrigger value="stats">
          <BarChart3 className="w-4 h-4 mr-2" />
          Statistics
        </TabsTrigger>
      </TabsList>

      {/* Profile Information Tab */}
      <TabsContent value="profile" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your profile information and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar size="2xl">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback size="2xl">
                  {user.name?.charAt(0)?.toUpperCase() || 
                   user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF (max. 2MB)
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter username" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be your unique identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormDescription>
                        Contact support to change your email address
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={updating === 'profile'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'profile' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Profile
                </Button>
              </form>
            </Form>

            <Separator />

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Account Created</p>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Last Login</p>
                  <p>
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Preferences Tab */}
      <TabsContent value="preferences" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your experience and notification settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...preferencesForm}>
              <form onSubmit={preferencesForm.handleSubmit(onUpdatePreferences)} className="space-y-6">
                {/* Appearance Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Appearance
                  </h3>
                  
                  <FormField
                    control={preferencesForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred theme
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Localization */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Localization
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={preferencesForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notifications
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={preferencesForm.control}
                      name="notifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>General Notifications</FormLabel>
                            <FormDescription>
                              Receive notifications about your todos and teams
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
                      control={preferencesForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Email Notifications</FormLabel>
                            <FormDescription>
                              Receive email updates about important activities
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
                      control={preferencesForm.control}
                      name="weeklyDigest"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-1">
                            <FormLabel>Weekly Digest</FormLabel>
                            <FormDescription>
                              Get a weekly summary of your productivity
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
                  disabled={updating === 'preferences'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'preferences' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Update Preferences
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Enter new password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <PasswordStrength password={field.value || ''} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={updating === 'password'}
                  className="w-full sm:w-auto"
                >
                  {updating === 'password' ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>
              Manage additional security features for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Button variant="outline" disabled>
                Enable 2FA
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </div>

            {/* Active Sessions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Active Sessions</h4>
                <p className="text-sm text-muted-foreground">
                  View and manage your active sessions
                </p>
              </div>
              <Button variant="outline" disabled>
                Manage Sessions
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </div>

            {/* Recent Login Activity */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Recent Activity</h4>
                <p className="text-sm text-muted-foreground">
                  View recent login attempts and activities
                </p>
              </div>
              <Button variant="outline" disabled>
                View Activity
                <Badge variant="secondary" className="ml-2">Soon</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible account actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 border border-warning/20 rounded-lg bg-warning/5">
              <div className="space-y-1">
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download all your todos, teams, and account data
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

            {/* Deactivate Account */}
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="space-y-1">
                <h4 className="font-medium">Deactivate Account</h4>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable your account and data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to deactivate your account? This will:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Hide your profile from other users</li>
                        <li>Disable access to your todos and teams</li>
                        <li>Prevent you from logging in</li>
                        <li>Keep your data for 30 days in case you want to reactivate</li>
                      </ul>
                      <p className="mt-2 font-medium">
                        You can reactivate your account by contacting support within 30 days.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeactivateAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Deactivate Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Statistics Tab */}
      <TabsContent value="stats" className="space-y-6">
        {stats && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPersonalTodos}</p>
                      <p className="text-xs text-muted-foreground">Personal Todos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalTeams}</p>
                      <p className="text-xs text-muted-foreground">Teams Joined</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{Math.floor(stats.totalTimeSpent / 60)}h</p>
                      <p className="text-xs text-muted-foreground">Time Tracked</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
                      <p className="text-xs text-muted-foreground">Completed This Month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Personal Productivity */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Productivity</CardTitle>
                  <CardDescription>Your personal todo completion stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completion Rate</span>
                    <span className="font-medium">
                      {Math.round((stats.completedPersonalTodos / stats.totalPersonalTodos) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(stats.completedPersonalTodos / stats.totalPersonalTodos) * 100} 
                    className="w-full"
                  />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{stats.completedPersonalTodos}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalPersonalTodos - stats.completedPersonalTodos}
                      </p>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Collaboration */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>Your team participation summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Productivity</span>
                    <span className="font-medium">{stats.productivity}%</span>
                  </div>
                  <Progress value={stats.productivity} className="w-full" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Teams</span>
                      <span className="font-medium">{stats.totalTeams}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Team Todos</span>
                      <span className="font-medium">{stats.totalTeamTodos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Time/Day</span>
                      <span className="font-medium">{Math.round(stats.totalTimeSpent / 30)}min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
                <CardDescription>Your productivity trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Activity chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}