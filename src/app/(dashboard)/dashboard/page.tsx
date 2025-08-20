import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  PlusCircle,
  ShoppingCart,
  Calendar,
  Target
} from "lucide-react"

// Mock data - replace with actual API calls
const portfolioData = {
  totalPlayers: 12,
  investedAmount: 2400000,
  currentValue: 2780000,
  profitLoss: 380000,
  profitMargin: 15.83
}

const recentTransactions = [
  {
    id: "1",
    playerName: "João Silva",
    type: "purchase" as const,
    amount: 120000,
    date: "2024-08-15",
    team: "FC Barcelona B"
  },
  {
    id: "2", 
    playerName: "Marcus Johnson",
    type: "sale" as const,
    amount: 285000,
    date: "2024-08-12",
    team: "Real Madrid C",
    profit: 65000
  },
  {
    id: "3",
    playerName: "Pierre Dubois",
    type: "purchase" as const,
    amount: 95000,
    date: "2024-08-10",
    team: "PSG Youth"
  }
]

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user?.name || session.user?.email}. Here's your portfolio overview.
        </p>
      </div>

      {/* Portfolio Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioData.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioData.investedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total investment capital
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${portfolioData.currentValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio market value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Loss</CardTitle>
            {portfolioData.profitLoss >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              portfolioData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {portfolioData.profitLoss >= 0 ? '+' : ''}${portfolioData.profitLoss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {portfolioData.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest player purchases and sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.playerName}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={transaction.type === 'purchase' ? 'secondary' : 'success'}
                      >
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>${transaction.amount.toLocaleString()}</span>
                        {transaction.type === 'sale' && transaction.profit && (
                          <span className="text-xs text-green-600">
                            +${transaction.profit.toLocaleString()} profit
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/transactions">View All Transactions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/players/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Player
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/players">
                <Users className="mr-2 h-4 w-4" />
                Manage Players
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Record Sale
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/analytics">
                <Calendar className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>
            Key performance indicators for your trading portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">8</div>
              <div className="text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-muted-foreground">Sold Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">12.5</div>
              <div className="text-sm text-muted-foreground">Avg. Weeks Held</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}