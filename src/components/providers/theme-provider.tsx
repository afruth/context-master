'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextType | null>(null)

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    } else if (!savedTheme) {
      // If no saved theme, explicitly set light theme
      setThemeState('light')
      localStorage.setItem('theme', 'light')
    }
  }, [])

  // Listen for system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to DOM
  React.useEffect(() => {
    const actualTheme = theme === 'system' ? systemTheme : theme
    const root = document.documentElement
    
    // Always remove first to ensure clean state
    root.classList.remove('dark')
    
    if (actualTheme === 'dark') {
      root.classList.add('dark')
    }
    
    // Force a style recalculation
    root.style.colorScheme = actualTheme
  }, [theme, systemTheme])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  const actualTheme = theme === 'system' ? systemTheme : theme

  const value = React.useMemo(() => ({
    theme,
    setTheme,
    actualTheme,
  }), [theme, setTheme, actualTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}