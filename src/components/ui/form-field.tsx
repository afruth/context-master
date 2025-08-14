import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        error: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const formErrorVariants = cva(
  "text-sm font-medium",
  {
    variants: {
      variant: {
        error: "text-destructive",
        warning: "text-yellow-600 dark:text-yellow-500",
        info: "text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "error",
    },
  }
)

const formHelperTextVariants = cva(
  "text-sm text-muted-foreground",
  {
    variants: {
      variant: {
        default: "",
        small: "text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof formFieldVariants> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  inputSize?: "sm" | "default" | "lg"
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    className, 
    variant, 
    label, 
    error, 
    helperText, 
    required, 
    inputSize = "default",
    id,
    ...props 
  }, ref) => {
    const hasError = Boolean(error)
    const computedVariant = hasError ? "error" : variant
    const inputId = id || `form-field-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={cn(formFieldVariants({ variant: computedVariant, className }))}>
        {label && (
          <Label htmlFor={inputId} className="text-sm font-medium">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          error={hasError}
          size={inputSize}
          aria-invalid={hasError}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <div
            id={`${inputId}-error`}
            className={cn(formErrorVariants({ variant: "error" }))}
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        {helperText && !error && (
          <div
            id={`${inputId}-helper`}
            className={cn(formHelperTextVariants({ variant: "default" }))}
          >
            {helperText}
          </div>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField, formFieldVariants, formErrorVariants, formHelperTextVariants }