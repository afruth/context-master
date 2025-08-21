"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  User, 
  Lock, 
  Mail, 
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  DollarSign,
  Settings as SettingsIcon
} from "lucide-react"
import { CurrencySelector } from "@/components/currency-selector"
import { useSettings } from "@/hooks/use-settings"

interface UserProfile {
  name: string | null
  email: string
  username: string | null
  currency?: string
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { settings, currency, isLoading: settingsLoading, updateCurrency } = useSettings()
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    username: "",
    currency: "USD"
  })
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    fetchingProfile: true,
    currency: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch current user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user')
        if (!response.ok) throw new Error('Failed to fetch profile')
        
        const userData = await response.json()
        setProfile({
          name: userData.name || "",
          email: userData.email || "",
          username: userData.username || "",
          currency: userData.currency || "USD"
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile data')
      } finally {
        setLoading(prev => ({ ...prev, fetchingProfile: false }))
      }
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const validateProfile = () => {
    const newErrors: Record<string, string> = {}
    
    if (!profile.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (profile.username && profile.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }
    
    if (profile.username && !/^[a-zA-Z0-9_-]+$/.test(profile.username)) {
      newErrors.username = 'Username can only contain letters, numbers, hyphens, and underscores'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswords = () => {
    const newErrors: Record<string, string> = {}
    
    if (!passwords.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!passwords.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwords.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateProfile()) return

    setLoading(prev => ({ ...prev, profile: true }))
    setErrors({})

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()
      
      // Update session with new data
      await update({
        name: updatedUser.name,
        email: updatedUser.email,
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      if (error instanceof Error) {
        if (error.message.includes('unique constraint')) {
          if (error.message.includes('email')) {
            setErrors({ email: 'This email is already in use' })
          } else if (error.message.includes('username')) {
            setErrors({ username: 'This username is already taken' })
          }
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Failed to update profile')
      }
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePasswords()) return

    setLoading(prev => ({ ...prev, password: true }))
    setErrors({})

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Error changing password:', error)
      if (error instanceof Error) {
        if (error.message.includes('Current password is incorrect')) {
          setErrors({ currentPassword: 'Current password is incorrect' })
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error('Failed to change password')
      }
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleCurrencyChange = async (currencyCode: string) => {
    setProfile(prev => ({ ...prev, currency: currencyCode }))
  }

  const handleCurrencyUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile.currency) return
    
    setLoading(prev => ({ ...prev, currency: true }))
    
    try {
      const success = await updateCurrency(profile.currency)
      if (success) {
        toast.success('Currency preference updated successfully')
      } else {
        toast.error('Failed to update currency preference')
      }
    } catch (error) {
      console.error('Error updating currency:', error)
      toast.error('Failed to update currency preference')
    } finally {
      setLoading(prev => ({ ...prev, currency: false }))
    }
  }

  if (loading.fetchingProfile) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your profile information and account details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profile.name || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    disabled={loading.profile}
                  />
                  {errors.name && (
                    <p className="text-sm text-loss flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={profile.username || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Choose a username"
                    disabled={loading.profile}
                  />
                  {errors.username && (
                    <p className="text-sm text-loss flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  disabled={loading.profile}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-loss flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading.profile}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading.profile ? "Updating..." : "Update Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator />

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Change your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    disabled={loading.password}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                    disabled={loading.password}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-loss flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.currentPassword}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      disabled={loading.password}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                      disabled={loading.password}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-loss flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      disabled={loading.password}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                      disabled={loading.password}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-loss flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading.password}
                className="w-full md:w-auto"
              >
                <Lock className="mr-2 h-4 w-4" />
                {loading.password ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        {/* Application Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Application Preferences
            </CardTitle>
            <CardDescription>
              Configure your currency and calculation preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCurrencyUpdate} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Currency</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select your preferred currency for all calculations and displays. This affects skill predictions, 
                    profit calculations, and all financial data throughout the application.
                  </p>
                  <div className="space-y-3">
                    <CurrencySelector
                      value={settings?.currency || profile.currency || "USD"}
                      onValueChange={handleCurrencyChange}
                      disabled={loading.currency || settingsLoading}
                      placeholder="Select your currency..."
                      showConversionRate={true}
                    />
                    
                    {currency && (
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{currency.name} ({currency.code})</span>
                        </div>
                        {currency.rate !== 1.0 && (
                          <div className="text-muted-foreground">
                            1 USD = {(1 / currency.rate).toFixed(currency.rate < 0.01 ? 0 : 2)} {currency.code}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={loading.currency || settingsLoading}
                className="w-full md:w-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading.currency ? "Updating..." : "Update Preferences"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Separator />
        
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              View your account details and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm text-muted-foreground">User ID</Label>
                <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {session?.user?.id}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Member Since</Label>
                <div className="text-sm">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}