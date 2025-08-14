import * as React from "react"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/cn"
import { Badge } from "@/components/ui/badge"

export interface CommentCountBadgeProps {
  count: number
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'default'
}

export function CommentCountBadge({
  count,
  className,
  showIcon = true,
  size = 'default',
}: CommentCountBadgeProps) {
  if (count === 0) return null

  return (
    <Badge 
      variant="secondary" 
      size={size}
      className={cn(
        "gap-1 text-muted-foreground",
        className
      )}
    >
      {showIcon && <MessageSquare className="h-3 w-3" />}
      <span>{count}</span>
    </Badge>
  )
}