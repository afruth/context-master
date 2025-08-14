import * as React from "react"
import { MessageSquare, Loader2 } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CommentItem } from "./comment-item"
import { AddCommentForm } from "./add-comment-form"
import { CommentEditForm } from "./comment-edit-form"
import { TodoCommentWithUser } from "@/types/api"

export interface CommentsListProps {
  comments: TodoCommentWithUser[]
  loading: boolean
  hasMore?: boolean
  currentUser: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  userRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  onAddComment: (content: string) => Promise<void>
  onEditComment: (commentId: string, content: string) => Promise<void>
  onDeleteComment: (commentId: string) => Promise<void>
  onLoadMore?: () => void
  addingComment?: boolean
  className?: string
}

export function CommentsList({
  comments,
  loading,
  hasMore = false,
  currentUser,
  userRole,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLoadMore,
  addingComment = false,
  className,
}: CommentsListProps) {
  const [editingCommentId, setEditingCommentId] = React.useState<string | null>(null)

  const handleEditStart = (comment: TodoCommentWithUser) => {
    setEditingCommentId(comment.id)
  }

  const handleEditSave = async (content: string) => {
    if (!editingCommentId) return
    
    try {
      await onEditComment(editingCommentId, content)
      setEditingCommentId(null)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
  }

  const handleDelete = async (commentId: string) => {
    try {
      await onDeleteComment(commentId)
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  }

  if (loading && comments.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Comments Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Comments {comments.length > 0 && `(${comments.length})`}
        </span>
      </div>

      {/* Add Comment Form */}
      <AddCommentForm
        onSubmit={onAddComment}
        currentUser={currentUser}
        loading={addingComment}
        placeholder="Share your thoughts..."
      />

      {comments.length > 0 && <Separator />}

      {/* Comments List */}
      {comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No comments yet"
          description="Be the first to share your thoughts on this task."
          compact
        />
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <div key={comment.id}>
              {editingCommentId === comment.id ? (
                <div className="py-3">
                  <CommentEditForm
                    initialContent={comment.content}
                    onSave={handleEditSave}
                    onCancel={handleEditCancel}
                  />
                </div>
              ) : (
                <CommentItem
                  comment={comment}
                  currentUserId={currentUser.id}
                  userRole={userRole}
                  onEdit={handleEditStart}
                  onDelete={handleDelete}
                />
              )}
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more comments'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}