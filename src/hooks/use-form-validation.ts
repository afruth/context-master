import { useForm, UseFormProps, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export interface UseFormValidationOptions<T extends FieldValues>
  extends Omit<UseFormProps<T>, "resolver"> {
  schema: z.ZodType<T>
}

export function useFormValidation<T extends FieldValues>({
  schema,
  ...options
}: UseFormValidationOptions<T>) {
  return useForm<T>({
    resolver: zodResolver(schema) as any,
    ...options,
  })
}

// Common validation schemas
export const taskValidationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(5000, "Description is too long").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.date().optional(),
  category: z.string().max(50, "Category is too long").optional(),
  tags: z.array(z.string()).default([]),
  estimatedMinutes: z.number().min(0).max(10080).optional(), // Max 7 days in minutes
})

export const boardValidationSchema = z.object({
  name: z.string().min(1, "Board name is required").max(100, "Board name is too long"),
  description: z.string().optional(),
  color: z.string().optional(),
  isPrivate: z.boolean().optional(),
})

export const userValidationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const signInValidationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type TaskFormData = z.infer<typeof taskValidationSchema>
export type BoardFormData = z.infer<typeof boardValidationSchema>
export type UserFormData = z.infer<typeof userValidationSchema>
export type SignInFormData = z.infer<typeof signInValidationSchema>