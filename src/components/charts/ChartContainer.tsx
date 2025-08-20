"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/cn"

export interface ChartContainerProps {
  children: ReactNode
  title: string
  description?: string
  className?: string
  loading?: boolean
  error?: string
  emptyState?: ReactNode
}

export function ChartContainer({
  children,
  title,
  description,
  className,
  loading = false,
  error,
  emptyState
}: ChartContainerProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-red-500 mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">Failed to load chart data</p>
          </div>
        ) : emptyState ? (
          <div className="flex items-center justify-center h-64">
            {emptyState}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}