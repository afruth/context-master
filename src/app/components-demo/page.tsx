"use client"

import * as React from "react"
import { Plus, Settings, User, Calendar, Tag, Filter, Check } from "lucide-react"
import {
  Button,
  Card,
  Input,
  Label,
  Checkbox,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  LoadingSpinner,
  LoadingSection,
  EmptyState,
  Progress,
  Switch,
  Separator,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui"
import { TaskCard, TaskList, TaskFilters } from "@/components/task"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Task } from "@/components/task/task-card"

const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Design new landing page",
    description: "Create a modern, responsive landing page with improved user experience and conversion optimization.",
    status: "todo",
    priority: "high",
    dueDate: new Date(2024, 2, 15),
    tags: ["design", "frontend"],
    assignee: {
      id: "user1",
      name: "Alice Johnson",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b8c0?w=32&h=32&fit=crop&crop=face"
    },
    createdAt: new Date(2024, 1, 1),
    updatedAt: new Date(2024, 1, 5)
  },
  {
    id: "2", 
    title: "Implement user authentication",
    description: "Set up secure user authentication with NextAuth.js and implement proper session management.",
    status: "in-progress",
    priority: "urgent",
    dueDate: new Date(2024, 2, 10),
    tags: ["backend", "auth"],
    assignee: {
      id: "user2",
      name: "Bob Smith",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face"
    },
    createdAt: new Date(2024, 1, 2),
    updatedAt: new Date(2024, 1, 8)
  },
  {
    id: "3",
    title: "Write API documentation",
    description: "Document all API endpoints with examples and response schemas.",
    status: "completed",
    priority: "medium",
    tags: ["documentation"],
    createdAt: new Date(2024, 1, 3),
    updatedAt: new Date(2024, 1, 10)
  },
  {
    id: "4",
    title: "Optimize database queries",
    description: "Review and optimize slow database queries to improve application performance.",
    status: "todo",
    priority: "low",
    dueDate: new Date(2024, 2, 20),
    tags: ["backend", "performance"],
    createdAt: new Date(2024, 1, 4),
    updatedAt: new Date(2024, 1, 4)
  }
]

export default function ComponentsDemo() {
  const [tasks, setTasks] = React.useState<Task[]>(sampleTasks)
  const [filters, setFilters] = React.useState({})
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const handleTaskStatusChange = (taskId: string, completed: boolean) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: completed ? "completed" : "todo" as const }
        : task
    ))
    
    toast({
      title: completed ? "Task completed!" : "Task reopened",
      description: `Task has been ${completed ? "marked as complete" : "reopened"}.`,
      variant: completed ? "success" : "default"
    })
  }

  const showToastExample = (variant: "default" | "success" | "warning" | "destructive" | "info") => {
    toast({
      title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Toast`,
      description: `This is a ${variant} toast notification example.`,
      variant,
    })
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">
              UI Component Library Demo
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive showcase of all the UI components built for the collaborative to-do application.
              Each component follows accessibility standards and includes proper TypeScript interfaces.
            </p>
          </div>

          {/* Base Components */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Base Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Buttons</h3>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="destructive" size="sm">Delete</Button>
                    <Button variant="ghost" size="lg">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Form Controls</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="demo-input">Input Field</Label>
                    <Input id="demo-input" placeholder="Enter text..." />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="demo-checkbox" />
                    <Label htmlFor="demo-checkbox">Checkbox example</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="demo-switch" />
                    <Label htmlFor="demo-switch">Switch example</Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Badges & Avatars</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Error</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge priority="low">Low</Badge>
                    <Badge priority="medium">Medium</Badge>
                    <Badge priority="high">High</Badge>
                    <Badge priority="urgent">Urgent</Badge>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Avatar size="sm">
                      <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b8c0?w=32&h=32&fit=crop&crop=face" />
                      <AvatarFallback>AJ</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                      <AvatarFallback>BS</AvatarFallback>
                    </Avatar>
                    <Avatar size="lg">
                      <AvatarFallback>XY</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Loading States */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Loading States</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Spinners</h3>
                <div className="space-y-3">
                  <div className="flex gap-4 items-center">
                    <LoadingSpinner size="sm" />
                    <LoadingSpinner />
                    <LoadingSpinner size="lg" />
                  </div>
                  <LoadingSpinner label="Loading tasks..." />
                  <Button disabled>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </Button>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Skeletons</h3>
                <div className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <SkeletonAvatar />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                  <SkeletonText lines={3} />
                  <Separator />
                  <SkeletonCard />
                </div>
              </Card>
            </div>
          </section>

          {/* Progress & Status */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Progress & Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Progress Bars</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Default Progress</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} showValue />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Success</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} variant="success" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Warning</span>
                      <span>30%</span>
                    </div>
                    <Progress value={30} variant="warning" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-medium">Empty States</h3>
                <EmptyState
                  icon={<Plus className="h-6 w-6" />}
                  title="No tasks yet"
                  description="Create your first task to get started with your productivity journey."
                  action={{
                    label: "Add Task",
                    onClick: () => toast({ title: "Add task clicked!" })
                  }}
                  size="sm"
                />
              </Card>
            </div>
          </section>

          {/* Task Components */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Task Components</h2>
            <div className="space-y-6">
              {/* Task Filters */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Task Filters</h3>
                <TaskFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableAssignees={[
                    { id: "user1", name: "Alice Johnson", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b8c0?w=32&h=32&fit=crop&crop=face" },
                    { id: "user2", name: "Bob Smith", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" }
                  ]}
                  availableTags={["design", "frontend", "backend", "auth", "documentation", "performance"]}
                />
              </Card>

              {/* Task Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Task Cards</h3>
                  <div className="space-y-3">
                    {tasks.slice(0, 2).map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleTaskStatusChange}
                        onEdit={(task) => toast({ title: "Edit task", description: `Editing: ${task.title}` })}
                        onDelete={(taskId) => toast({ title: "Delete task", description: "Task deleted", variant: "destructive" })}
                        onClick={(task) => toast({ title: "Task clicked", description: task.title })}
                      />
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Task List</h3>
                  <TaskList
                    title="Sample Tasks"
                    tasks={tasks.slice(0, 3)}
                    onTaskStatusChange={handleTaskStatusChange}
                    onTaskEdit={(task) => toast({ title: "Edit task", description: `Editing: ${task.title}` })}
                    onTaskDelete={(taskId) => toast({ title: "Delete task", description: "Task deleted", variant: "destructive" })}
                    onTaskClick={(task) => toast({ title: "Task clicked", description: task.title })}
                    onAddTask={() => toast({ title: "Add task clicked!" })}
                    variant="column"
                  />
                </Card>
              </div>
            </div>
          </section>

          {/* Interactive Examples */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Interactive Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Tabs */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Tabs</h3>
                <Tabs defaultValue="tab1" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1" className="mt-4">
                    <p className="text-sm text-muted-foreground">Content for tab 1</p>
                  </TabsContent>
                  <TabsContent value="tab2" className="mt-4">
                    <p className="text-sm text-muted-foreground">Content for tab 2</p>
                  </TabsContent>
                  <TabsContent value="tab3" className="mt-4">
                    <p className="text-sm text-muted-foreground">Content for tab 3</p>
                  </TabsContent>
                </Tabs>
              </Card>

              {/* Dialog */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Dialog</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sample Dialog</DialogTitle>
                      <DialogDescription>
                        This is a sample dialog with some content.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p>Dialog content goes here.</p>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline">Cancel</Button>
                        <Button>Confirm</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>

              {/* Tooltips */}
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Tooltips</h3>
                <div className="space-y-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">Hover me</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a tooltip</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Settings</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <User className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Profile</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Toast Examples */}
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold">Toast Notifications</h2>
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Toast Examples</h3>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => showToastExample("default")}>
                  Default Toast
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => showToastExample("success")}
                >
                  Success Toast
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => showToastExample("warning")}
                >
                  Warning Toast
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => showToastExample("destructive")}
                >
                  Error Toast
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => showToastExample("info")}
                >
                  Info Toast
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}