import { toast } from "sonner"

export interface ToastOptions {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number
}

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    })
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action,
    })
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action,
    })
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action,
    })
  },

  loading: (message: string, options?: { description?: string }) => {
    return toast.loading(message, {
      description: options?.description,
    })
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, messages)
  },
}

// Specific toast messages for common actions
export const toastMessages = {
  player: {
    created: (name: string) => 
      showToast.success("Player created", { 
        description: `${name} has been added to your squad` 
      }),
    updated: (name: string) => 
      showToast.success("Player updated", { 
        description: `${name}'s information has been saved` 
      }),
    deleted: (name: string) => 
      showToast.success("Player deleted", { 
        description: `${name} has been removed from your squad` 
      }),
    importSuccess: (count: number) => 
      showToast.success("Import successful", { 
        description: `${count} players have been imported` 
      }),
    exportSuccess: () => 
      showToast.success("Export successful", { 
        description: "Your player data has been downloaded" 
      }),
  },
  
  filters: {
    cleared: () => 
      showToast.info("Filters cleared", { 
        description: "All filters have been reset" 
      }),
    applied: (count: number) => 
      showToast.info("Filters applied", { 
        description: `Showing ${count} players` 
      }),
  },

  errors: {
    generic: (action: string) => 
      showToast.error("Something went wrong", { 
        description: `Failed to ${action}. Please try again.`,
        action: {
          label: "Retry",
          onClick: () => window.location.reload()
        }
      }),
    network: () => 
      showToast.error("Network error", { 
        description: "Please check your connection and try again",
        action: {
          label: "Retry",
          onClick: () => window.location.reload()
        }
      }),
    validation: (field: string) => 
      showToast.error("Invalid input", { 
        description: `Please check the ${field} field and try again` 
      }),
  },
}