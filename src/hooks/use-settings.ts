"use client"

import { useState, useEffect, useCallback } from 'react'
import { getCurrencyByCode, DEFAULT_CURRENCY, type Currency } from '@/lib/currencies'

interface UserSettings {
  currency: string
}

interface UseSettingsReturn {
  settings: UserSettings | null
  currency: Currency
  isLoading: boolean
  error: string | null
  updateCurrency: (currencyCode: string) => Promise<boolean>
  refreshSettings: () => Promise<void>
}

/**
 * Global settings hook that manages user preferences including currency
 * Falls back to localStorage if user is not authenticated
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get current currency object
  const currency = getCurrencyByCode(settings?.currency || 'USD') || DEFAULT_CURRENCY

  // Fetch settings from API or localStorage
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try to fetch from API first (for authenticated users)
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else if (response.status === 401) {
        // User not authenticated, use localStorage
        const localCurrency = localStorage.getItem('hattrick-currency') || 'USD'
        setSettings({ currency: localCurrency })
      } else {
        throw new Error('Failed to fetch settings')
      }
    } catch (err) {
      console.warn('Error fetching settings, using localStorage fallback:', err)
      
      // Fallback to localStorage
      const localCurrency = localStorage.getItem('hattrick-currency') || 'USD'
      setSettings({ currency: localCurrency })
      
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update currency setting
  const updateCurrency = useCallback(async (currencyCode: string): Promise<boolean> => {
    try {
      setError(null)

      // Validate currency code
      const currencyData = getCurrencyByCode(currencyCode)
      if (!currencyData) {
        setError(`Invalid currency code: ${currencyCode}`)
        return false
      }

      // Try to update via API first
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ currency: currencyCode })
      })

      if (response.ok) {
        // API update successful
        const data = await response.json()
        setSettings({ currency: data.currency })
        
        // Also update localStorage as backup
        localStorage.setItem('hattrick-currency', currencyCode)
        return true
      } else if (response.status === 401) {
        // User not authenticated, update localStorage only
        localStorage.setItem('hattrick-currency', currencyCode)
        setSettings({ currency: currencyCode })
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }
    } catch (err) {
      console.warn('Error updating currency via API, updating localStorage only:', err)
      
      // Fallback to localStorage update
      localStorage.setItem('hattrick-currency', currencyCode)
      setSettings({ currency: currencyCode })
      
      setError(err instanceof Error ? err.message : 'Unknown error')
      return false
    }
  }, [])

  // Refresh settings
  const refreshSettings = useCallback(async () => {
    await fetchSettings()
  }, [fetchSettings])

  // Initialize settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    currency,
    isLoading,
    error,
    updateCurrency,
    refreshSettings
  }
}

/**
 * Simple hook to just get the current currency without full settings management
 */
export function useCurrency(): { currency: Currency; isLoading: boolean } {
  const { currency, isLoading } = useSettings()
  return { currency, isLoading }
}