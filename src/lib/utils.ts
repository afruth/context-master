import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatCurrency as baseCurrencyFormat, getCurrencyByCode, type Currency } from "./currencies"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enhanced currency formatting utility that works with user's selected currency
 * This is the primary function to use throughout the application for displaying monetary values
 */
export function formatCurrency(
  amount: number, 
  currency: Currency | string, 
  options?: {
    showSymbol?: boolean
    showCode?: boolean
    decimals?: number
    showSign?: boolean // Whether to show +/- sign for positive/negative values
  }
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 0,
    showSign = false
  } = options || {}

  // Get currency object if string was passed
  const currencyObj = typeof currency === 'string' ? getCurrencyByCode(currency) : currency
  
  if (!currencyObj) {
    // Fallback to basic formatting if currency not found
    const formatted = amount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    return showSign && amount > 0 ? `+${formatted}` : formatted
  }

  // Use the base formatCurrency function
  let result = baseCurrencyFormat(amount, currencyObj.code, {
    showSymbol,
    showCode,
    decimals
  })

  // Add positive sign if requested and amount is positive
  if (showSign && amount > 0 && showSymbol) {
    // Insert + after currency symbol but before amount
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF'].includes(currencyObj.code)) {
      result = result.replace(currencyObj.symbol, `${currencyObj.symbol}+`)
    } else {
      result = `+${result}`
    }
  } else if (showSign && amount > 0) {
    result = `+${result}`
  }

  return result
}

/**
 * Quick utility to format currency with profit/loss coloring context
 * Commonly used pattern in the application
 */
export function formatProfitLoss(
  amount: number,
  currency: Currency | string,
  options?: {
    decimals?: number
    showCode?: boolean
  }
): { 
  formatted: string
  isProfit: boolean
  isLoss: boolean
  isBreakeven: boolean
} {
  const formatted = formatCurrency(amount, currency, {
    ...options,
    showSign: true
  })
  
  return {
    formatted,
    isProfit: amount > 0,
    isLoss: amount < 0,
    isBreakeven: amount === 0
  }
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