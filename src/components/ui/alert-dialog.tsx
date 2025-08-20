"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/cn"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simple hook for confirmation dialogs
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [config, setConfig] = React.useState<{
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
  } | null>(null)

  const confirm = React.useCallback((options: {
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
    onConfirm: () => void
  }) => {
    setConfig(options)
    setIsOpen(true)
  }, [])

  const dialog = config ? (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={config.title}
      description={config.description}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      onConfirm={config.onConfirm}
    />
  ) : null

  return { confirm, dialog }
}