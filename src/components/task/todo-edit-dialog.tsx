'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useToast } from '@/hooks/use-toast'
import { PersonalTodo, TodoStatus, Priority } from '@prisma/client'

const todoEditSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  dueDate: z.date().optional().nullable(),
  category: z.string().optional(),
  tags: z.string().optional(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
})

type TodoEditForm = z.infer<typeof todoEditSchema>

interface TodoEditDialogProps {
  isOpen: boolean
  onClose: () => void
  todo: PersonalTodo & { tags: string[] }
  onSuccess: () => void
}

export function TodoEditDialog({ isOpen, onClose, todo, onSuccess }: TodoEditDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TodoEditForm>({
    resolver: zodResolver(todoEditSchema),
    defaultValues: {
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      dueDate: todo.dueDate ? new Date(todo.dueDate) : null,
      category: todo.category || '',
      tags: todo.tags.join(', '),
      estimatedMinutes: todo.estimatedMinutes || null,
    },
  })

  const onSubmit = async (data: TodoEditForm) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/todos/personal/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          dueDate: data.dueDate?.toISOString(),
          completedAt: data.status === 'COMPLETED' && todo.status !== 'COMPLETED' 
            ? new Date().toISOString() 
            : data.status !== 'COMPLETED' 
            ? null 
            : todo.completedAt,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      toast({
        title: 'Todo updated',
        description: 'Your todo has been successfully updated.',
      })

      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ] as const

  const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription>
            Update your todo details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter todo title..."
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter todo description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as TodoStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              <DatePicker
                value={form.watch('dueDate')}
                onChange={(date) => form.setValue('dueDate', date)}
                placeholder="Select due date..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min="0"
                {...form.register('estimatedMinutes', { valueAsNumber: true })}
                placeholder="e.g., 60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...form.register('category')}
              placeholder="e.g., Work, Personal, Shopping..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              {...form.register('tags')}
              placeholder="Enter tags separated by commas..."
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas (e.g., urgent, important, review)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}