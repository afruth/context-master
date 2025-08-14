'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Tag, Clock } from 'lucide-react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { MultiSelect } from '@/components/ui/multi-select'
import { AppLayout } from '@/components/layouts/app-layout'
import { useCreatePersonalTodo } from '@/hooks/use-todos'

interface NewTodoClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

interface TodoFormData {
  title: string
  description: string
  priority: string
  dueDate: Date | null
  category: string
  tags: string[]
  estimatedMinutes: string
}

const initialFormData: TodoFormData = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  dueDate: null,
  category: '',
  tags: [],
  estimatedMinutes: '',
}

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'text-gray-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
]

const commonCategories = [
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Learning',
  'Shopping',
  'Travel',
  'Home',
]

const commonTags = [
  'important',
  'urgent',
  'project',
  'meeting',
  'call',
  'email',
  'research',
  'review',
  'planning',
  'creative',
]

export function NewTodoClient({ user }: NewTodoClientProps) {
  const router = useRouter()
  const [formData, setFormData] = React.useState<TodoFormData>(initialFormData)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  
  const createTodo = useCreatePersonalTodo()

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) {
          newErrors.title = 'Title is required'
        } else if (value.length > 200) {
          newErrors.title = 'Title is too long'
        } else {
          delete newErrors.title
        }
        break
      case 'description':
        if (value && value.length > 5000) {
          newErrors.description = 'Description is too long'
        } else {
          delete newErrors.description
        }
        break
      case 'category':
        if (value && value.length > 50) {
          newErrors.category = 'Category is too long'
        } else {
          delete newErrors.category
        }
        break
      case 'estimatedMinutes':
        if (value && (isNaN(value) || value < 0 || value > 10080)) {
          newErrors.estimatedMinutes = 'Please enter a valid number of minutes'
        } else {
          delete newErrors.estimatedMinutes
        }
        break
    }
    
    setErrors(newErrors)
  }

  const handleInputChange = (field: keyof TodoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateField(field, value)
  }

  const validateForm = () => {
    let isValid = true
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Title is required'
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
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate?.toISOString(),
        category: formData.category === 'none' ? undefined : formData.category.trim() || undefined,
        tags: formData.tags,
        estimatedMinutes: formData.estimatedMinutes ? parseInt(formData.estimatedMinutes) : undefined,
      }

      await createTodo.mutateAsync(submitData)
      router.push('/dashboard/todos')
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to create todo:', error)
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
                <h1 className="text-2xl font-bold">Create New Todo</h1>
                <p className="text-muted-foreground">
                  Add a new task to your personal todo list
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
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="What needs to be done?"
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Add more details about this task..."
                      rows={4}
                      className={errors.description ? 'border-destructive' : ''}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <span className={option.color}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Category</SelectItem>
                          {commonCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Due Date
                      </Label>
                      <DatePicker
                        date={formData.dueDate}
                        onDateChange={(date) => handleInputChange('dueDate', date)}
                        placeholder="Select due date"
                        fromDate={new Date()} // Don't allow past dates
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedMinutes">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Estimated Time (minutes)
                      </Label>
                      <Input
                        id="estimatedMinutes"
                        type="number"
                        min="0"
                        max="10080"
                        value={formData.estimatedMinutes}
                        onChange={(e) => handleInputChange('estimatedMinutes', e.target.value)}
                        placeholder="e.g. 30"
                        className={errors.estimatedMinutes ? 'border-destructive' : ''}
                      />
                      {errors.estimatedMinutes && (
                        <p className="text-sm text-destructive">{errors.estimatedMinutes}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">
                      <Tag className="h-4 w-4 inline mr-1" />
                      Tags
                    </Label>
                    <MultiSelect
                      options={commonTags.map(tag => ({ value: tag, label: tag }))}
                      selected={formData.tags}
                      onChange={(tags) => handleInputChange('tags', tags)}
                      placeholder="Add tags..."
                      allowCustom={true}
                      maxSelections={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add up to 10 tags to categorize your task
                    </p>
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
                  disabled={!formData.title.trim() || createTodo.isPending}
                >
                  {createTodo.isPending ? 'Creating...' : 'Create Todo'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}