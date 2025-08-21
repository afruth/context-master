"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Target,
  Trophy,
  Clock
} from "lucide-react"
import type { PlayerWithCalculations } from "@/types/hattrick"
import { playersApi } from "@/lib/api"
import { CardSkeleton } from "@/components/ui/skeleton"
import { RecordSaleModal } from "@/components/record-sale-modal"
import { SkillPrediction } from "@/components/skill-prediction"
import { 
  calculatePercentageKept, 
  calculateCurrentProjectedProfit,
  countSalaryPayments,
  calculateSalaryCostForPeriod
} from "@/lib/calculations"
import { useCurrency } from "@/hooks/use-settings"
import { formatCurrency, formatProfitLoss } from "@/lib/utils"


export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currency } = useCurrency()
  const [player, setPlayer] = useState<PlayerWithCalculations | null>(null)
  const [loading, setLoading] = useState(true)
  const [saleModalOpen, setSaleModalOpen] = useState(false)

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        setLoading(true)
        const result = await playersApi.getById(params.id as string)
        setPlayer(result)
      } catch (error) {
        console.error("Error loading player:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadPlayer()
    }
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return
    }

    try {
      await playersApi.delete(params.id as string)
      router.push("/players")
    } catch (error) {
      console.error("Error deleting player:", error)
      alert('Failed to delete player. Please try again.')
    }
  }

  // Handle sale recorded - refresh player data
  const handleSaleRecorded = async () => {
    try {
      const result = await playersApi.getById(params.id as string)
      setPlayer(result)
    } catch (error) {
      console.error("Error refreshing player:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <CardSkeleton />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Player not found</p>
        <Button className="mt-4" asChild>
          <Link href="/players">Back to Players</Link>
        </Button>
      </div>
    )
  }

  // Calculate current percentage kept using days owned (more accurate than weeks)
  const currentPercentageKept = calculatePercentageKept({
    daysOwned: player.daysOwned || 0
  })

  // Use estimatedSaleValue if available, otherwise fall back to calculated current value
  const currentValue = player.estimatedSaleValue || player.currentValue || Math.round(player.purchaseDetails.price * 1.1)

  // Calculate projected profit using proper calculation functions
  let profitProjection = null
  if (player.currentStatus === 'OWNED' && player.salaryHistory.length > 0) {
    try {
      // Convert salary history dates from strings to Date objects
      const salaryHistoryWithDates = player.salaryHistory.map(sh => ({
        ...sh,
        startDate: new Date(sh.startDate),
        endDate: sh.endDate ? new Date(sh.endDate) : undefined,
        createdAt: new Date(sh.createdAt),
        updatedAt: new Date(sh.updatedAt)
      }))

      profitProjection = calculateCurrentProjectedProfit({
        player,
        projectedSaleValue: currentValue,
        salaryHistory: salaryHistoryWithDates
      })
    } catch (error) {
      console.warn('Could not calculate projected profit:', error)
      // Fallback calculation
      const totalSalaryCost = player.salaryHistory.reduce((total, salary) => {
        const weeks = player.weeksOwned || 0
        return total + (salary.weeklyPay * weeks)
      }, 0)
      
      profitProjection = {
        currentPercentageKept: currentPercentageKept.percentageKept,
        projectedSaleValue: currentValue,
        projectedNetSaleValue: Math.round(currentValue * (currentPercentageKept.percentageKept / 100)),
        projectedProfit: Math.round(currentValue * (currentPercentageKept.percentageKept / 100)) - player.purchaseDetails.price - totalSalaryCost
      }
    }
  } else {
    // Simple fallback when no salary history
    profitProjection = {
      currentPercentageKept: currentPercentageKept.percentageKept,
      projectedSaleValue: currentValue,
      projectedNetSaleValue: Math.round(currentValue * (currentPercentageKept.percentageKept / 100)),
      projectedProfit: Math.round(currentValue * (currentPercentageKept.percentageKept / 100)) - player.purchaseDetails.price
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
            <p className="text-muted-foreground">
              {player.position} • {player.nationality}
              {player.speciality && ` • ${player.speciality}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/players/${player.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          {player.currentStatus === 'OWNED' && (
            <Button onClick={() => setSaleModalOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          )}

          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <Badge 
          variant={
            player.currentStatus === 'OWNED' ? 'success' : 
            player.currentStatus === 'SOLD' ? 'secondary' : 'outline'
          }
          className="text-sm"
        >
          {player.currentStatus.toLowerCase()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(player.purchaseDetails.price, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(player.purchaseDetails.date).toLocaleDateString()}
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
              {formatCurrency(currentValue, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {player.estimatedSaleValue ? 'Estimated sale value' : 'Estimated market value'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weeks Owned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {player.weeksOwned || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPercentageKept.percentageKept}% kept on sale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Profit</CardTitle>
            {(profitProjection?.projectedProfit || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (profitProjection?.projectedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(profitProjection?.projectedProfit || 0, currency, { showSign: true })}
            </div>
            <p className="text-xs text-muted-foreground">
              If sold at current value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Player Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Player Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{player.age.years}y {player.age.days}d</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium">{player.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nationality</span>
                <span className="font-medium">{player.nationality}</span>
              </div>
              {player.speciality && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speciality</span>
                  <span className="font-medium">{player.speciality}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Form</span>
                <span className="font-medium">{player.form}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stamina</span>
                <span className="font-medium">{player.stamina}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(player.skills).map(([skill, level]) => {
                if (level === undefined || level === 0) return null
                
                const skillNames: Record<string, string> = {
                  keeper: "Goalkeeper",
                  defending: "Defending", 
                  playmaking: "Playmaking",
                  winger: "Winger",
                  passing: "Passing",
                  scoring: "Scoring",
                  setPieces: "Set Pieces"
                }

                return (
                  <div key={skill} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{skillNames[skill]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(level / 20) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-medium w-8 text-right">{level}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Skill Prediction */}
        <SkillPrediction
          skills={player.skills}
          age={player.age}
          wage={(() => {
            // Get current wage from most recent salary history entry
            if (player.salaryHistory.length === 0) return undefined;
            const currentSalary = player.salaryHistory
              .filter(sh => !sh.endDate || new Date(sh.endDate) > new Date())
              .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
            return currentSalary?.weeklyPay;
          })()}
          currencyRate={currency.rate}
        />

        {/* Profit Calculation/Projection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {player.currentStatus === 'SOLD' ? 'Profit Calculation' : 'Profit Projection'}
            </CardTitle>
            <CardDescription>
              {player.currentStatus === 'SOLD' 
                ? 'Final profit/loss calculation from the sale'
                : 'Based on current market value and ownership duration'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {player.currentStatus === 'SOLD' && player.saleTransactions.length > 0 ? (
                // Show actual sale data for sold players
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale Price</span>
                    <span className="font-medium">{formatCurrency(player.saleTransactions[0].salePrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage Kept</span>
                    <span className="font-medium">{player.saleTransactions[0].percentageKept}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Sale Value</span>
                    <span className="font-medium">{formatCurrency(Math.round(player.saleTransactions[0].salePrice * (player.saleTransactions[0].percentageKept / 100)), currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Salary Cost</span>
                    <span className="font-medium">-{(() => {
                      // Calculate actual salary cost for sold player
                      const salaryHistoryWithDates = player.salaryHistory.map(sh => ({
                        ...sh,
                        startDate: new Date(sh.startDate),
                        endDate: sh.endDate ? new Date(sh.endDate) : undefined,
                        createdAt: new Date(sh.createdAt),
                        updatedAt: new Date(sh.updatedAt)
                      }))
                      const totalCost = calculateSalaryCostForPeriod(
                        salaryHistoryWithDates,
                        new Date(player.purchaseDetails.date),
                        new Date(player.saleTransactions[0].saleDate)
                      )
                      return formatCurrency(totalCost, currency)
                    })()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="font-medium">-{formatCurrency(player.purchaseDetails.price, currency)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Final Profit/Loss</span>
                    <span className={`font-bold ${
                      player.saleTransactions[0].profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(player.saleTransactions[0].profitLoss, currency, { showSign: true })}
                    </span>
                  </div>
                </>
              ) : (
                // Show projection for owned players
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="font-medium">{formatCurrency(profitProjection?.projectedSaleValue || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage Kept</span>
                    <span className="font-medium">{profitProjection?.currentPercentageKept}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Sale Value</span>
                    <span className="font-medium">{formatCurrency(profitProjection?.projectedNetSaleValue || 0, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Salary Cost</span>
                    <span className="font-medium">-{(() => {
                      // Calculate current salary cost for owned player
                      const salaryHistoryWithDates = player.salaryHistory.map(sh => ({
                        ...sh,
                        startDate: new Date(sh.startDate),
                        endDate: sh.endDate ? new Date(sh.endDate) : undefined,
                        createdAt: new Date(sh.createdAt),
                        updatedAt: new Date(sh.updatedAt)
                      }))
                      const totalCost = calculateSalaryCostForPeriod(
                        salaryHistoryWithDates,
                        new Date(player.purchaseDetails.date),
                        new Date()
                      )
                      return formatCurrency(totalCost, currency)
                    })()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="font-medium">-{formatCurrency(player.purchaseDetails.price, currency)}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Projected Profit</span>
                    <span className={`font-bold ${
                      (profitProjection?.projectedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(profitProjection?.projectedProfit || 0, currency, { showSign: true })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Purchase Transaction */}
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">
                    Player purchased{player.purchaseDetails.fromTeam ? ` from ${player.purchaseDetails.fromTeam}` : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(player.purchaseDetails.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-red-600">
                    -{formatCurrency(player.purchaseDetails.price, currency)}
                  </div>
                  <Badge variant="secondary">
                    purchase
                  </Badge>
                </div>
              </div>

              {/* Sale Transactions */}
              {player.saleTransactions.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Player sold{sale.toTeam ? ` to ${sale.toTeam}` : ''}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +{formatCurrency(sale.salePrice, currency)}
                    </div>
                    <Badge variant="success">sale</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary History */}
      {player.salaryHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Salary History</CardTitle>
            <CardDescription>
              Weekly salary payments for this player
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Weekly Pay</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.salaryHistory.map((salary) => {
                  // Calculate payments for this specific salary period
                  const periodStart = new Date(salary.startDate)
                  const periodEnd = salary.endDate ? new Date(salary.endDate) : new Date()
                  const purchaseDate = new Date(player.purchaseDetails.date)
                  
                  const payments = countSalaryPayments(periodStart, periodEnd, purchaseDate)
                  const totalCost = payments * salary.weeklyPay
                  
                  return (
                    <TableRow key={salary.id}>
                      <TableCell>
                        {periodStart.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {salary.endDate ? new Date(salary.endDate).toLocaleDateString() : 'Current'}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(salary.weeklyPay, currency)}
                      </TableCell>
                      <TableCell>
                        {payments} payments
                      </TableCell>
                      <TableCell>
                        {formatCurrency(totalCost, currency)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Sale Modal */}
      {player && (
        <RecordSaleModal
          player={player}
          open={saleModalOpen}
          onOpenChange={setSaleModalOpen}
          onSaleRecorded={handleSaleRecorded}
        />
      )}
    </div>
  )
}