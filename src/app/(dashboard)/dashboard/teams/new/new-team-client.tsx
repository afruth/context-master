'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Palette, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/layouts/app-layout'
import { useCreateTeam } from '@/hooks/use-teams'

interface NewTeamClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface TeamFormData {
  name: string
  description: string
  isPublic: boolean
  color: string
}

const initialFormData: TeamFormData = {
  name: '',
  description: '',
  isPublic: false,
  color: '#06b6d4',
}

const colorOptions = [
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#ec4899', // pink
]

export function NewTeamClient({ user }: NewTeamClientProps) {
  const router = useRouter()
  const [formData, setFormData] = React.useState<TeamFormData>(initialFormData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  
  const createTeam = useCreateTeam()

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'name':
        if (!value || value.trim().length === 0) {
          newErrors.name = 'Team name is required'
        } else if (value.length < 2) {
          newErrors.name = 'Team name must be at least 2 characters'
        } else if (value.length > 100) {
          newErrors.name = 'Team name is too long'
        } else {
          delete newErrors.name
        }
        break
      case 'description':
        if (value && value.length > 500) {
          newErrors.description = 'Description is too long'
        } else {
          delete newErrors.description
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleInputChange = (field: keyof TeamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const validateForm = () => {
    let isValid = true
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Team name is required'
      isValid = false
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPublic: formData.isPublic,
        color: formData.color,
      }

      const newTeam = await createTeam.mutateAsync(submitData)
      router.push(`/dashboard/teams/${newTeam.id}`)
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to create team:', error)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <AppLayout user={user}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Create New Team</h1>
                <p className="text-muted-foreground">
                  Set up a team to collaborate with others on shared projects
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Team Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter team name"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this team is for..."
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Optional. Help team members understand the team's purpose.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="color">
                      <Palette className="h-4 w-4 inline mr-1" />
                      Team Color
                    </Label>
                    <div className="grid grid-cols-5 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                            formData.color === color 
                              ? 'border-foreground shadow-md' 
                              : 'border-border hover:border-foreground/50'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => handleInputChange('color', color)}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <Label htmlFor="isPublic">Public Team</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Public teams can be discovered and joined by others. 
                        Private teams are invite-only.
                      </p>
                    </div>
                    <Switch
                      id="isPublic"
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                    />
                  </div>

                  {/* Preview */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3">Team Preview</h4>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.name.slice(0, 2).toUpperCase() || 'TM'}
                      </div>
                      <div>
                        <div className="font-medium">
                          {formData.name || 'Team Name'}
                        </div>
                        {formData.description && (
                          <div className="text-sm text-muted-foreground">
                            {formData.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {formData.isPublic ? (
                              <><Globe className="h-3 w-3" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3" /> Private</>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            1 member
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!formData.name.trim() || createTeam.isPending}
                >
                  {createTeam.isPending ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}