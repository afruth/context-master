import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"
import { Check, X } from "lucide-react"

const passwordStrengthVariants = cva(
  "w-full space-y-3",
  {
    variants: {
      variant: {
        default: "",
        compact: "space-y-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const strengthBarVariants = cva(
  "h-1 rounded-full transition-colors duration-300",
  {
    variants: {
      strength: {
        weak: "bg-red-500",
        fair: "bg-yellow-500",
        good: "bg-blue-500",
        strong: "bg-green-500",
      },
    },
  }
)

const requirementVariants = cva(
  "flex items-center gap-2 text-sm transition-colors duration-200",
  {
    variants: {
      met: {
        true: "text-green-600 dark:text-green-400",
        false: "text-muted-foreground",
      },
    },
    defaultVariants: {
      met: false,
    },
  }
)

export interface PasswordStrengthProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof passwordStrengthVariants> {
  password: string
  showRequirements?: boolean
  showStrengthBar?: boolean
}

interface PasswordRequirement {
  id: string
  label: string
  test: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "letter",
    label: "Contains at least one letter",
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: "number",
    label: "Contains at least one number",
    test: (password) => /\d/.test(password),
  },
]

function calculatePasswordStrength(password: string): {
  score: number
  strength: "weak" | "fair" | "good" | "strong"
  metRequirements: number
} {
  let score = 0
  let metRequirements = 0

  requirements.forEach((req) => {
    if (req.test(password)) {
      score += 1
      metRequirements += 1
    }
  })

  // Additional complexity checks
  if (password.length >= 12) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1

  let strength: "weak" | "fair" | "good" | "strong"
  if (score <= 2) strength = "weak"
  else if (score <= 3) strength = "fair"
  else if (score <= 4) strength = "good"
  else strength = "strong"

  return { score, strength, metRequirements }
}

const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({ 
    className, 
    variant, 
    password, 
    showRequirements = true, 
    showStrengthBar = true,
    ...props 
  }, ref) => {
    const { strength, metRequirements } = React.useMemo(
      () => calculatePasswordStrength(password),
      [password]
    )

    const strengthPercentage = Math.min((metRequirements / requirements.length) * 100, 100)

    if (!password) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(passwordStrengthVariants({ variant, className }))}
        {...props}
      >
        {showStrengthBar && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">
                Password strength
              </span>
              <span className="text-xs font-medium capitalize text-muted-foreground">
                {strength}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div
                className={cn(strengthBarVariants({ strength }))}
                style={{ width: `${strengthPercentage}%` }}
              />
            </div>
          </div>
        )}

        {showRequirements && (
          <div className="space-y-1">
            {requirements.map((requirement) => {
              const isMet = requirement.test(password)
              return (
                <div
                  key={requirement.id}
                  className={cn(requirementVariants({ met: isMet }))}
                >
                  {isMet ? (
                    <Check className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <X className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span>{requirement.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)
PasswordStrength.displayName = "PasswordStrength"

export { PasswordStrength, passwordStrengthVariants, calculatePasswordStrength }