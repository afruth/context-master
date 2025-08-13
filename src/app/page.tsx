import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Context Master</CardTitle>
          <CardDescription className="text-lg mt-2">
            A modern Next.js application with authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Built with Next.js 15, Tailwind CSS v4, Prisma, SQLite, and NextAuth.js v5
          </div>
          
          {session ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Logged in as {session.user?.email}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" className="w-full">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="w-full">
                <Button className="w-full">Login</Button>
              </Link>
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full">Register</Button>
              </Link>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="text-xs text-center text-muted-foreground">
              <p>Features:</p>
              <ul className="mt-2 space-y-1">
                <li>✓ Local authentication with email/password</li>
                <li>✓ Protected routes with middleware</li>
                <li>✓ Modern UI with shadcn/ui components</li>
                <li>✓ SQLite database with Prisma ORM</li>
                <li>✓ TypeScript for type safety</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}