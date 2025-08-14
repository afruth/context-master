import { randomBytes, createHash } from 'crypto'

/**
 * Generate a secure random invitation token
 */
export function generateInvitationToken(): string {
  // Generate 32 random bytes and convert to hex
  const randomToken = randomBytes(32).toString('hex')
  
  // Add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36)
  
  // Combine and hash for additional security
  const combined = `${randomToken}-${timestamp}`
  const hash = createHash('sha256').update(combined).digest('hex')
  
  // Return first 64 characters for a reasonable token length
  return hash.substring(0, 64)
}

/**
 * Generate a team invite code (shorter, human-readable)
 */
export function generateTeamInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}

/**
 * Hash a string using SHA-256
 */
export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

/**
 * Verify if a token matches its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashString(token) === hash
}