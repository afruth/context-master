"use client"

import * as React from "react"
import { showToast } from "@/lib/toast"

interface UseAsyncActionOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: any) => void
}

export function useAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  options: UseAsyncActionOptions = {}
) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const execute = React.useCallback(
    async (...args: T): Promise<R | null> => {
      try {
        setLoading(true)
        setError(null)
        
        const result = await action(...args)
        
        if (options.successMessage) {
          showToast.success(options.successMessage)
        }
        
        options.onSuccess?.()
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred"
        setError(errorMessage)
        
        if (options.errorMessage) {
          showToast.error(options.errorMessage, {
            description: errorMessage
          })
        } else {
          showToast.error("Something went wrong", {
            description: errorMessage
          })
        }
        
        options.onError?.(err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [action, options]
  )

  return {
    execute,
    loading,
    error,
    reset: () => setError(null)
  }
}