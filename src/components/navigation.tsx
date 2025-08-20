"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import LogoutButton from "@/components/logout-button"
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle,
  BarChart3,
  Settings,
  Receipt,
  Menu
} from "lucide-react"

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Players",
    href: "/players",
    icon: Users,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Add Player",
    href: "/players/add",
    icon: PlusCircle,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Steptrick</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                
                return (
                  <Button
                    key={item.name}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link href={item.href} className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
          
          {/* Desktop Logout */}
          <div className="hidden md:block">
            <LogoutButton />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-left text-primary">Steptrick</SheetTitle>
                  <SheetDescription className="text-left text-muted-foreground">
                    Navigate your trading portfolio
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex flex-col space-y-3 mt-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || 
                      (item.href !== "/dashboard" && pathname.startsWith(item.href))
                    
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? "default" : "ghost"}
                        className="justify-start h-12"
                        asChild
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={item.href} className="flex items-center space-x-3">
                          <Icon className="h-5 w-5" />
                          <span className="text-base">{item.name}</span>
                        </Link>
                      </Button>
                    )
                  })}
                  
                  {/* Mobile Logout Button */}
                  <div className="pt-4 mt-4 border-t">
                    <LogoutButton />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}