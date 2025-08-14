'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/providers/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {theme === 'light' && <Sun className="h-4 w-4 mr-2" />}
          {theme === 'dark' && <Moon className="h-4 w-4 mr-2" />}
          {theme === 'system' && <Monitor className="h-4 w-4 mr-2" />}
          {theme === 'light' && 'Light'}
          {theme === 'dark' && 'Dark'}
          {theme === 'system' && 'System'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ThemeSection() {
  const { theme, setTheme, actualTheme } = useTheme()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">Appearance</h4>
          <p className="text-sm text-muted-foreground">
            Choose how the application looks. System will match your device settings.
          </p>
        </div>
        <ThemeToggle />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant={theme === 'light' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('light')}
          className="flex flex-col h-20 p-2"
        >
          <Sun className="h-6 w-6 mb-2" />
          Light
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="flex flex-col h-20 p-2"
        >
          <Moon className="h-6 w-6 mb-2" />
          Dark
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme('system')}
          className="flex flex-col h-20 p-2"
        >
          <Monitor className="h-6 w-6 mb-2" />
          System
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Current theme: {actualTheme} {theme === 'system' && '(following system)'}
      </p>
    </div>
  )
}