import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password)
  
  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  })
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

export async function updateUser(id: string, data: {
  name?: string | null
  email?: string
  username?: string | null
}) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      updatedAt: true
    }
  })
}

export async function updateUserPassword(id: string, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword)
  
  return prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword
    }
  })
}

export async function verifyUserPassword(id: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true }
  })

  if (!user || !user.password) {
    return false
  }

  return bcrypt.compare(password, user.password)
}