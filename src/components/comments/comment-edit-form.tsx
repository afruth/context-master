import * as React from "react"
import { Save, X } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export interface CommentEditFormProps {
  initialContent: string
  onSave: (content: string) => Promise<void>
  onCancel: () => void
  loading?: boolean
  className?: string
}

export function CommentEditForm({
  initialContent,
  onSave,
  onCancel,
  loading = false,
  className,
}: CommentEditFormProps) {
  const [content, setContent] = React.useState(initialContent)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-focus and resize on mount
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(content.length, content.length)
      
      // Auto-resize
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [content.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || loading || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSave(content.trim())
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
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
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
  const hasChanges = content.trim() !== initialContent.trim()

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        disabled={loading || isSubmitting}
        className="min-h-[60px] max-h-[120px] resize-none"
        placeholder="Edit your comment..."
      />
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Cmd+Enter</kbd> to save, 
          <kbd className="px-1 py-0.5 text-xs bg-muted rounded ml-1">Esc</kbd> to cancel
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          
          <Button
            type="submit"
            size="sm"
            disabled={isDisabled || !hasChanges}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}