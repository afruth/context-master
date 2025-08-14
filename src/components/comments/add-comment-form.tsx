import * as React from "react"
import { Send, MessageSquare } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface AddCommentFormProps {
  onSubmit: (content: string) => Promise<void>
  currentUser: {
    id: string
    name: string | null
    image: string | null
  }
  loading?: boolean
  placeholder?: string
  className?: string
}

export function AddCommentForm({
  onSubmit,
  currentUser,
  loading = false,
  placeholder = "Add a comment...",
  className,
}: AddCommentFormProps) {
  const [content, setContent] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || loading || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(content.trim())
      setContent("")
      // Auto-resize textarea back to single line
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      // Error handling is done in the mutation hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const isDisabled = loading || isSubmitting || !content.trim()

  return (
    <form onSubmit={handleSubmit} className={cn("", className)}>
      <div className="flex gap-3">
        <Avatar size="sm" className="mt-1">
          <AvatarImage src={currentUser.image || undefined} />
          <AvatarFallback size="sm">
            {currentUser.name 
              ? currentUser.name.slice(0, 2).toUpperCase()
              : <MessageSquare className="h-3 w-3" />
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading || isSubmitting}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Cmd+Enter</kbd> to submit
            </div>
            
            <Button
              type="submit"
              size="sm"
              disabled={isDisabled}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}