"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  DollarSign,
  CalendarDays,
  Target,
  Activity
} from "lucide-react"
import { analyticsApi, ApiError } from "@/lib/api"
import { CardSkeleton } from "@/components/ui/skeleton"
import { ProfitTrendChart } from "@/components/charts/ProfitTrendChart"
import { PortfolioCompositionChart } from "@/components/charts/PortfolioCompositionChart"
import { PositionPerformanceChart } from "@/components/charts/PositionPerformanceChart"
import { AgeGroupChart } from "@/components/charts/AgeGroupChart"
import { PlayerValueChart } from "@/components/charts/PlayerValueChart"
import { ProfitLossComparisonChart } from "@/components/charts/ProfitLossComparisonChart"
import type { AnalyticsData } from "@/types/hattrick"
import { useCurrency } from "@/hooks/use-settings"
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils"

export default function AnalyticsPage() {
  const { currency } = useCurrency()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includePortfolio, setIncludePortfolio] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
        try {
          setLoading(true)
          setError(null)
          
          const analyticsResult = await analyticsApi.getAnalytics({ includePortfolio })
          setAnalyticsData(analyticsResult)
        } catch (err) {
          console.error('Error fetching analytics data:', err)
          setError(err instanceof ApiError ? err.message : 'Failed to fetch analytics data')
        } finally {
          setLoading(false)
        }
      }
      
      fetchAnalytics()
  }, [includePortfolio])

  if (loading && !analyticsData) {
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

  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value, currency)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance insights for your trading portfolio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          <div className="flex rounded-md border">
            <Button
              variant={includePortfolio ? "default" : "ghost"}
              size="sm"
              onClick={() => setIncludePortfolio(true)}
              className="rounded-r-none"
            >
              Including Portfolio
            </Button>
            <Button
              variant={!includePortfolio ? "default" : "ghost"}
              size="sm"
              onClick={() => setIncludePortfolio(false)}
              className="rounded-l-none"
            >
              Realized Only
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* Key Metrics Overview */}
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
                <CardTitle className="text-sm font-medium">
                  {includePortfolio ? 'Total Profit' : 'Realized Profit'}
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (analyticsData?.summary?.totalProfit || 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {formatCurrency(analyticsData?.summary?.totalProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {includePortfolio && analyticsData?.summary?.realizedProfit !== undefined ? (
                    <>
                      Realized: {formatCurrency(analyticsData.summary.realizedProfit)} • 
                      Unrealized: {formatCurrency(analyticsData.summary.unrealizedProfit || 0)}
                    </>
                  ) : (
                    `${analyticsData?.summary?.profitMargin?.toFixed(1) || 0}% profit margin`
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  (analyticsData?.summary?.averageProfit || 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {formatCurrency(analyticsData?.summary?.averageProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per transaction average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.summary?.successRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Profitable transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Holding Period</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData?.summary?.averageHoldingPeriod || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Weeks per player
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Primary Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProfitTrendChart
          data={analyticsData?.profitTrends || []}
          loading={loading}
          error={error}
        />

        <PortfolioCompositionChart
          data={analyticsData?.positionStats || []}
          loading={loading}
          error={error}
        />
      </div>

      {/* Secondary Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <PositionPerformanceChart
          data={analyticsData?.positionStats || []}
          loading={loading}
          error={error}
        />

        <AgeGroupChart
          data={analyticsData?.ageGroupStats || []}
          loading={loading}
          error={error}
        />
      </div>

      {/* Additional Analysis Charts */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ProfitLossComparisonChart
          data={analyticsData?.monthlyProfits || []}
          loading={loading}
          error={error}
        />

        <PlayerValueChart
          data={analyticsData?.playerValueDistribution || []}
          loading={loading}
          error={error}
        />
      </div>

      {/* Detailed Statistics */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
            <CardDescription>
              Profit breakdown by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : analyticsData?.monthlyProfits && analyticsData.monthlyProfits.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.monthlyProfits.slice(-6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{month.month} {month.year}</div>
                      <div className="text-sm text-muted-foreground">
                        {month.transactionCount} transactions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        month.totalProfit >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {formatCurrency(month.totalProfit)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(month.averageProfit)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No monthly data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Position Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Position Statistics
            </CardTitle>
            <CardDescription>
              Performance by player position
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : analyticsData?.positionStats && analyticsData.positionStats.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.positionStats.map((position, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{position.position}</div>
                      <div className="text-sm text-muted-foreground">
                        {position.playerCount} players • {position.successRate.toFixed(1)}% success
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        position.totalProfit >= 0 ? 'text-profit' : 'text-loss'
                      }`}>
                        {formatCurrency(position.totalProfit)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(position.averageProfit)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No position data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trading Performance Summary
          </CardTitle>
          <CardDescription>
            Overall portfolio performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalPlayers || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Players Traded</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.totalTransactions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Completed Transactions</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">
                  {analyticsData?.summary?.averageHoldingPeriod || 0}
                </div>
                <div className="text-sm text-muted-foreground">Avg Holding Period (weeks)</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className={`text-2xl font-bold ${
                  (analyticsData?.summary?.totalProfit || 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {formatCurrency(analyticsData?.summary?.totalProfit || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Profit/Loss</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className={`text-2xl font-bold ${
                  (analyticsData?.summary?.profitMargin || 0) >= 0 ? 'text-profit' : 'text-loss'
                }`}>
                  {analyticsData?.summary?.profitMargin.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Profit Margin</div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.summary?.successRate.toFixed(1) || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}