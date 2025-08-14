'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home,
  CheckSquare,
  Users,
  Settings,
  Plus,
  BarChart3,
  Clock,
  User,
  LogOut,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { 
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  SidebarSection,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LogoutButton from '@/components/logout-button'
import { useCommandPalette } from '@/components/providers/command-palette-provider'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface AppLayoutProps {
  children: React.ReactNode
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navigationItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    exact: true,
  },
  {
    href: '/dashboard/todos',
    icon: CheckSquare,
    label: 'Personal Todos',
  },
  {
    href: '/dashboard/teams',
    icon: Users,
    label: 'Teams',
  },
  {
    href: '/dashboard/reports',
    icon: BarChart3,
    label: 'Reports',
  },
  {
    href: '/dashboard/time',
    icon: Clock,
    label: 'Time Tracking',
  },
]

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname()
  const { open: openCommandPalette } = useCommandPalette()
  
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="border-r">
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Todo App</h2>
              <p className="text-xs text-muted-foreground">Collaborative Tasks</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarSection title="Main">
            <SidebarNav>
              {navigationItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  active={isActive(item.href, item.exact)}
                  icon={<item.icon className="h-4 w-4" />}
                >
                  {item.label}
                </SidebarNavItem>
              ))}
            </SidebarNav>
          </SidebarSection>

          <SidebarSection title="Quick Actions">
            <div className="px-3 space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start" 
                onClick={openCommandPalette}
              >
                <Search className="h-4 w-4 mr-2" />
                Search...
                <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
              </Button>
              
              <Link href="/dashboard/todos/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  New Todo
                </Button>
              </Link>
              <Link href="/dashboard/teams/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </Link>
            </div>
          </SidebarSection>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2">
                <Avatar size="sm" className="mr-3">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback>
                    {user?.name?.charAt(0)?.toUpperCase() || 
                     user?.email?.charAt(0)?.toUpperCase() || 
                     'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton variant="ghost" className="w-full justify-start p-0">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </LogoutButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}