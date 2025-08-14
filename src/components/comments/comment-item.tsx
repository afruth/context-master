import * as React from "react"
import { formatDistanceToNow } from "date-fns"
import { 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  User as UserIcon,
} from "lucide-react"
import { cn } from "@/lib/cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TodoCommentWithUser } from "@/types/api"

export interface CommentItemProps {
  comment: TodoCommentWithUser
  currentUserId: string
  userRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  onEdit?: (comment: TodoCommentWithUser) => void
  onDelete?: (commentId: string) => void
  className?: string
}

export function CommentItem({
  comment,
  currentUserId,
  userRole,
  onEdit,
  onDelete,
  className,
}: CommentItemProps) {
  const isAuthor = comment.userId === currentUserId
  const canEdit = isAuthor
  const canDelete = isAuthor || userRole === 'ADMIN' || userRole === 'OWNER'
  
  const handleEdit = () => {
    if (canEdit && onEdit) {
      onEdit(comment)
    }
  }
  
  const handleDelete = () => {
    if (canDelete && onDelete) {
      onDelete(comment.id)
    }
  }

  const formatTime = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  return (
    <div className={cn("group flex gap-3 py-3", className)}>
      <Avatar size="sm">
        <AvatarImage src={comment.user.image || undefined} />
        <AvatarFallback size="sm">
          {comment.user.name 
            ? comment.user.name.slice(0, 2).toUpperCase()
            : <UserIcon className="h-3 w-3" />
          }
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.user.name || 'Anonymous'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <Badge variant="secondary" size="sm" className="text-xs">
                  edited
                </Badge>
              )}
            </div>
            
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            </div>
          </div>
          
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                  <span className="sr-only">Comment actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit comment
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete comment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}