import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const sidebarVariants = cva(
  "flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "border-border",
        ghost: "border-transparent",
      },
      size: {
        default: "w-64",
        sm: "w-52",
        lg: "w-80",
        collapsed: "w-16",
      },
      position: {
        left: "left-0",
        right: "right-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "left",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  collapsible?: boolean
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({
    className,
    variant,
    size,
    position,
    collapsed = false,
    onCollapsedChange,
    collapsible = true,
    children,
    ...props
  }, ref) => {
    const computedSize = collapsed ? "collapsed" : size

    return (
      <div
        ref={ref}
        className={cn(
          sidebarVariants({ variant, size: computedSize, position }),
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    closable?: boolean
    onClose?: () => void
  }
>(({ className, closable, onClose, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-4 pb-2",
      className
    )}
    {...props}
  >
    <div className="flex-1 min-w-0">{children}</div>
    {closable && (
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 ml-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close sidebar</span>
      </Button>
    )}
  </div>
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto px-2", className)}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-4 pt-2 mt-auto", className)}
    {...props}
  />
))
SidebarFooter.displayName = "SidebarFooter"

const SidebarNav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("space-y-1", className)}
    {...props}
  />
))
SidebarNav.displayName = "SidebarNav"

const SidebarNavItem = React.forwardRef<
  HTMLAnchorElement,
  {
    href?: string
    active?: boolean
    icon?: React.ReactNode
    collapsed?: boolean
    className?: string
    children?: React.ReactNode
  }
>(({ className, active, icon, collapsed, href, children, ...props }, ref) => {
  const content = (
    <>
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      {!collapsed && (
        <span className="flex-1 truncate">{children}</span>
      )}
    </>
  )

  const baseClassName = cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
    active && "bg-accent text-accent-foreground",
    collapsed && "justify-center px-2",
    className
  )

  if (href) {
    return (
      <Link href={href} className={baseClassName} ref={ref} {...props}>
        {content}
      </Link>
    )
  }

  return (
    <div className={baseClassName} ref={ref} {...props}>
      {content}
    </div>
  )
})
SidebarNavItem.displayName = "SidebarNavItem"

const SidebarSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    title?: string
    collapsed?: boolean
  }
>(({ className, title, collapsed, children, ...props }, ref) => (
  <div ref={ref} className={cn("py-2", className)} {...props}>
    {title && !collapsed && (
      <div className="px-3 pb-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
      </div>
    )}
    {title && collapsed && <Separator className="mx-2 my-2" />}
    <div className="space-y-1">{children}</div>
  </div>
))
SidebarSection.displayName = "SidebarSection"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarNav,
  SidebarNavItem,
  SidebarSection,
}