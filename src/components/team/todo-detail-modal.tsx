import * as React from "react"
import { formatDistanceToNow, format } from "date-fns"
import { 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  User,
  Edit3,
  MessageSquare,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/cn"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommentsList } from "@/components/comments/comments-list"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TeamTodoSummary } from "@/types/api"
import { 
  useTodoComments, 
  useCreateTodoComment, 
  useUpdateTodoComment, 
  useDeleteTodoComment 
} from "@/hooks/use-teams"

export interface TodoDetailModalProps {
  todo: TeamTodoSummary | null
  teamId: string
  currentUser: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  userRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (todo: TeamTodoSummary) => void
  onStatusChange?: (todoId: string, completed: boolean) => void
  className?: string
}

export function TodoDetailModal({
  todo,
  teamId,
  currentUser,
  userRole,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
  className,
}: TodoDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<'details' | 'comments'>('details')

  // Comments queries and mutations
  const { data: commentsData, isLoading: commentsLoading } = useTodoComments(
    teamId, 
    todo?.id || '', 
    { limit: 50 },
  )
  
  const createCommentMutation = useCreateTodoComment(teamId, todo?.id || '')
  const updateCommentMutation = useUpdateTodoComment(teamId, todo?.id || '')
  const deleteCommentMutation = useDeleteTodoComment(teamId, todo?.id || '')

  const comments = commentsData?.data || []

  const handleAddComment = async (content: string) => {
    await createCommentMutation.mutateAsync({ content })
  }

  const handleEditComment = async (commentId: string, content: string) => {
    await updateCommentMutation.mutateAsync({ commentId, data: { content } })
  }

  const handleDeleteComment = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync(commentId)
  }

  const handleEdit = () => {
    if (todo && onEdit) {
      onEdit(todo)
      onOpenChange(false)
    }
  }

  const handleStatusToggle = () => {
    if (todo && onStatusChange) {
      onStatusChange(todo.id, todo.status !== 'COMPLETED')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return "text-gray-600 bg-gray-100"
      case 'MEDIUM':
        return "text-yellow-600 bg-yellow-100"
      case 'HIGH':
        return "text-orange-600 bg-orange-100"
      case 'URGENT':
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return "text-gray-600 bg-gray-100"
      case 'IN_PROGRESS':
        return "text-blue-600 bg-blue-100"
      case 'COMPLETED':
        return "text-green-600 bg-green-100"
      case 'CANCELLED':
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase()
  }

  if (!todo) return null

  const isCompleted = todo.status === 'COMPLETED'
  const canEdit = userRole && ['OWNER', 'ADMIN'].includes(userRole) || 
                  todo.assigneeId === currentUser.id || 
                  todo.createdById === currentUser.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] flex flex-col", className)}>
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className={cn(
                "text-xl font-semibold leading-tight pr-8",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {todo.title}
              </DialogTitle>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={getStatusColor(todo.status)}>
                  {formatStatus(todo.status)}
                </Badge>
                
                <Badge variant="outline" className={getPriorityColor(todo.priority)}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {todo.priority}
                </Badge>

                {todo.assignee && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{todo.assignee.name || todo.assignee.email}</span>
                  </div>
                )}

                {comments.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStatusToggle}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {isCompleted ? 'Reopen' : 'Complete'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              Comments
              {comments.length > 0 && (
                <Badge variant="secondary" size="sm">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex-1 overflow-auto">
            <div className="space-y-6">
              {/* Description */}
              {todo.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {todo.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created</span>
                    <div className="text-muted-foreground">
                      {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Updated</span>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(todo.updatedAt), { addSuffix: true })}
                    </div>
                  </div>

                  {todo.dueDate && (
                    <div>
                      <span className="font-medium">Due Date</span>
                      <div className={cn(
                        "text-muted-foreground",
                        new Date(todo.dueDate) < new Date() && !isCompleted && "text-red-500"
                      )}>
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}

                  {todo.completedAt && (
                    <div>
                      <span className="font-medium">Completed</span>
                      <div className="text-muted-foreground">
                        {format(new Date(todo.completedAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {todo.tags && todo.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Tags</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {todo.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignee & Creator */}
                <div className="grid grid-cols-2 gap-4">
                  {todo.assignee && (
                    <div>
                      <span className="font-medium text-sm">Assigned to</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar size="sm">
                          <AvatarImage src={todo.assignee.image || undefined} />
                          <AvatarFallback size="sm">
                            {todo.assignee.name?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{todo.assignee.name || todo.assignee.email}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-sm">Created by</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar size="sm">
                        <AvatarImage src={todo.createdBy.image || undefined} />
                        <AvatarFallback size="sm">
                          {todo.createdBy.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{todo.createdBy.name || todo.createdBy.email}</span>
                    </div>
                  </div>
                </div>

                {/* Time tracking */}
                {todo.timeEntries && todo.timeEntries.totalTime > 0 && (
                  <div>
                    <span className="font-medium text-sm">Time Tracked</span>
                    <div className="text-sm text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {Math.floor(todo.timeEntries.totalTime / 60)}h {todo.timeEntries.totalTime % 60}m
                      {todo.timeEntries.entryCount > 1 && (
                        <span className="ml-2">({todo.timeEntries.entryCount} sessions)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 overflow-auto">
            <CommentsList
              comments={comments}
              loading={commentsLoading}
              currentUser={currentUser}
              userRole={userRole}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              addingComment={createCommentMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}