"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
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
import { portfolioApi, transactionsApi, analyticsApi, ApiError } from "@/lib/api"
import { CardSkeleton } from "@/components/ui/skeleton"
import { ProfitTrendChart } from "@/components/charts/ProfitTrendChart"
import { PortfolioCompositionChart } from "@/components/charts/PortfolioCompositionChart"
import { ProfitDistributionChart } from "@/components/charts/ProfitDistributionChart"
import { ExportButton } from "@/components/export-button"
import type { AnalyticsData } from "@/types/hattrick"


export default function DashboardPage() {
  const [portfolioData, setPortfolioData] = useState({
    totalPlayers: 0,
    investedAmount: 0,
    currentValue: 0,
    profitLoss: 0,
    profitMargin: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<Array<{
    id: string
    playerName: string
    type: 'purchase' | 'sale'
    amount: number
    date: string
    team: string
    profit?: number | null
  }>>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartsError, setChartsError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
        try {
          setLoading(true)
          setError(null)
          
          const [portfolioResult, transactionsResult, playersResult] = await Promise.all([
            portfolioApi.getSummary(true),
            transactionsApi.getAll({ limit: 3 }),
            // Fetch recent purchases (latest added players)
            fetch('/api/players?sortBy=purchaseDate&sortOrder=desc&limit=5').then(res => res.json())
          ])
          
          console.log('Portfolio Result:', JSON.stringify(portfolioResult, null, 2))
          console.log('Portfolio Result Structure:', portfolioResult)
          
          setPortfolioData({
            totalPlayers: portfolioResult?.summary?.totalPlayers || 0,
            investedAmount: portfolioResult?.summary?.totalInvestment || 0,
            currentValue: portfolioResult?.summary?.totalPortfolioValue || 0,
            profitLoss: portfolioResult?.summary?.projectedTotalProfit || 0,
            profitMargin: portfolioResult?.summary?.overallProfitMargin || 0
          })
          
          // Combine sales and purchases into recent transactions
          const sales = (transactionsResult.data || []).map((transaction: {
            id: string
            player: { name: string }
            salePrice: number
            saleDate: string
            toTeam?: string
            profitLoss: number
          }) => ({
            id: `sale-${transaction.id}`,
            playerName: transaction.player.name,
            type: "sale" as const,
            amount: transaction.salePrice,
            date: transaction.saleDate,
            team: transaction.toTeam || 'Unknown',
            profit: transaction.profitLoss
          }))

          const purchases = (playersResult?.data || []).slice(0, 3).map((player: {
            id: string
            name: string
            purchaseDetails: {
              price: number
              date: string
              fromTeam?: string
            }
          }) => ({
            id: `purchase-${player.id}`,
            playerName: player.name || 'Unknown Player',
            type: "purchase" as const,
            amount: player.purchaseDetails?.price || 0,
            date: player.purchaseDetails?.date || new Date().toISOString(),
            team: player.purchaseDetails?.fromTeam || 'Free Agent',
            profit: null
          }))

          // Combine and sort by date
          const allTransactions = [...sales, ...purchases]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)

          setRecentTransactions(allTransactions)
        } catch (err) {
          console.error('Error fetching dashboard data:', err)
          setError(err instanceof ApiError ? err.message : 'Failed to fetch data')
          
          // Set default values on error
          setPortfolioData({
            totalPlayers: 0,
            investedAmount: 0,
            currentValue: 0,
            profitLoss: 0,
            profitMargin: 0
          })
          setRecentTransactions([])
        } finally {
          setLoading(false)
        }
      }

      const fetchAnalytics = async () => {
        try {
          setChartsLoading(true)
          setChartsError(null)
          
          // Fetch analytics with portfolio data included
          const analyticsResult = await analyticsApi.getAnalytics({ includePortfolio: true })
          setAnalyticsData(analyticsResult)
        } catch (err) {
          console.error('Error fetching analytics data:', err)
          setChartsError(err instanceof ApiError ? err.message : 'Failed to fetch analytics data')
        } finally {
          setChartsLoading(false)
        }
      }
      
      fetchData()
      fetchAnalytics()
  }, [])

  if (loading && !portfolioData.totalPlayers) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your portfolio overview.
          </p>
        </div>
        <ExportButton 
          exportType="portfolio"
          label="Export Portfolio"
          variant="outline"
        />
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* Portfolio Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardSkeleton />
              </CardHeader>
            </Card>
          ))
        ) : (
          <>
            <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolioData.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              Active players in portfolio
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
              ${(portfolioData.investedAmount || 0).toLocaleString()}
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
              ${(portfolioData.currentValue || 0).toLocaleString()}
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
              (portfolioData.profitLoss || 0) >= 0 ? 'text-profit' : 'text-loss'
            }`}>
              {(portfolioData.profitLoss || 0) >= 0 ? '+' : ''}${(portfolioData.profitLoss || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(portfolioData.profitMargin || 0).toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Profit Trend Chart */}
        <ProfitTrendChart
          data={analyticsData?.profitTrends || []}
          loading={chartsLoading}
          error={chartsError}
        />

        {/* Portfolio Composition Chart */}
        <PortfolioCompositionChart
          data={analyticsData?.positionStats || []}
          loading={chartsLoading}
          error={chartsError}
        />
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><CardSkeleton /></TableCell>
                      <TableCell><CardSkeleton /></TableCell>
                      <TableCell><CardSkeleton /></TableCell>
                      <TableCell><CardSkeleton /></TableCell>
                    </TableRow>
                  ))
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
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
                          <span>${(transaction.amount || 0).toLocaleString()}</span>
                          {transaction.type === 'sale' && transaction.profit && (
                            <span className="text-xs text-profit">
                              +${(transaction.profit || 0).toLocaleString()} profit
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No recent transactions
                    </TableCell>
                  </TableRow>
                )}
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
              <Link href="/players">
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
            Key performance indicators and recent profit trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-4 grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.summary?.totalPlayers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.summary?.totalTransactions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed Sales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.summary?.averageHoldingPeriod || 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg. Weeks Held</div>
              </div>
            </div>
            
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium">Recent Profit Trends</span>
              </div>
              <ProfitDistributionChart
                data={analyticsData?.monthlyProfits || []}
                className="w-full"
                height={60}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}