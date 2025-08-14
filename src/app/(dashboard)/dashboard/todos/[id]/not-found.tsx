import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function TodoNotFound() {
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Todo Not Found</CardTitle>
          <CardDescription>
            The todo you're looking for doesn't exist or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This todo may have been deleted, archived, or you may not have the necessary permissions to view it.
            </p>
            <div className="flex justify-center space-x-2">
              <Link href="/dashboard/todos">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Todos
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}