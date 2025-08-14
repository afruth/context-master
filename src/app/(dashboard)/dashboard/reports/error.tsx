'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportsErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ReportsError({ error, reset }: ReportsErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Reports page error:', error)
  }, [error])

  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We encountered an error while loading your reports. This might be a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-mono">{error.message || 'Unknown error occurred'}</p>
            {error.digest && (
              <p className="mt-1 text-xs">Error ID: {error.digest}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>If the problem persists, please contact support or try refreshing the page.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}