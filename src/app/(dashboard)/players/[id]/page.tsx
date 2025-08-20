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
import type { PlayerWithCalculations, PlayerStatus, SaleTransaction } from "@/types/hattrick"

// Mock data - replace with actual API calls
const mockPlayer: PlayerWithCalculations = {
  id: "1",
  name: "João Silva",
  age: { years: 18, days: 45 },
  position: "Winger",
  nationality: "Brazil",
  speciality: "Quick",
  form: 8,
  stamina: 7,
  skills: {
    winger: 9,
    passing: 6,
    defending: 4,
    scoring: 5,
    playmaking: 3,
    setPieces: 2
  },
  purchaseDetails: {
    date: new Date("2024-07-15"),
    price: 120000,
    fromTeam: "FC Barcelona B",
    hattrickWeek: 8,
    hattrickSeason: 85
  },
  currentStatus: "OWNED" as PlayerStatus,
  userId: "user1",
  createdAt: new Date("2024-07-15"),
  updatedAt: new Date("2024-08-01"),
  estimatedProfit: 45000,
  currentValue: 165000,
  weeksOwned: 5,
  saleTransactions: [],
  salaryHistory: [
    {
      id: "sal1",
      playerId: "1",
      weeklyPay: 2400,
      startDate: new Date("2024-07-15"),
      createdAt: new Date("2024-07-15"),
      updatedAt: new Date("2024-07-15")
    },
    {
      id: "sal2", 
      playerId: "1",
      weeklyPay: 2600,
      startDate: new Date("2024-08-01"),
      createdAt: new Date("2024-08-01"),
      updatedAt: new Date("2024-08-01")
    }
  ]
}

const mockTransactionHistory = [
  {
    id: "txn1",
    type: "purchase" as const,
    date: "2024-07-15",
    amount: 120000,
    description: "Player purchased from FC Barcelona B",
    team: "FC Barcelona B"
  }
]

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerWithCalculations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API call
    const loadPlayer = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setPlayer(mockPlayer)
      } catch (error) {
        console.error("Error loading player:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayer()
  }, [params.id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return
    }

    try {
      // TODO: Replace with actual API call
      console.log("Deleting player:", params.id)
      router.push("/players")
    } catch (error) {
      console.error("Error deleting player:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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

  const totalSalaryCost = player.salaryHistory.reduce((total, salary) => {
    const weeks = player.weeksOwned || 0
    return total + (salary.weeklyPay * weeks)
  }, 0)

  const profitProjection = {
    currentPercentageKept: Math.min(93, (player.weeksOwned || 0) * 5), // 5% per week
    projectedSaleValue: player.currentValue || 0,
    projectedNetSaleValue: ((player.currentValue || 0) * Math.min(93, (player.weeksOwned || 0) * 5)) / 100,
    projectedProfit: (((player.currentValue || 0) * Math.min(93, (player.weeksOwned || 0) * 5)) / 100) - player.purchaseDetails.price - totalSalaryCost
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
            <Button asChild>
              <Link href={`/players/${player.id}/sell`}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Record Sale
              </Link>
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
              ${player.purchaseDetails.price.toLocaleString()}
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
              ${player.currentValue?.toLocaleString() || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated market value
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
              {profitProjection.currentPercentageKept}% kept on sale
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Profit</CardTitle>
            {(player.estimatedProfit || 0) >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (player.estimatedProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {(player.estimatedProfit || 0) >= 0 ? '+' : ''}${(player.estimatedProfit || 0).toLocaleString()}
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

        {/* Profit Projection */}
        {player.currentStatus === 'OWNED' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Profit Projection
              </CardTitle>
              <CardDescription>
                Based on current market value and ownership duration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Value</span>
                  <span className="font-medium">${profitProjection.projectedSaleValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage Kept</span>
                  <span className="font-medium">{profitProjection.currentPercentageKept}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Sale Value</span>
                  <span className="font-medium">${profitProjection.projectedNetSaleValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Salary Cost</span>
                  <span className="font-medium">-${totalSalaryCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price</span>
                  <span className="font-medium">-${player.purchaseDetails.price.toLocaleString()}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Projected Profit</span>
                  <span className={`font-bold ${
                    profitProjection.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {profitProjection.projectedProfit >= 0 ? '+' : ''}${profitProjection.projectedProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              {mockTransactionHistory.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${
                      transaction.type === 'purchase' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaction.type === 'purchase' ? '-' : '+'}${transaction.amount.toLocaleString()}
                    </div>
                    <Badge variant={transaction.type === 'purchase' ? 'secondary' : 'success'}>
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              ))}

              {player.saleTransactions.map((sale) => (
                <div key={sale.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">Player sold to {sale.toTeam}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      +${sale.salePrice.toLocaleString()}
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.salaryHistory.map((salary) => {
                  const weeks = player.weeksOwned || 0
                  const totalCost = salary.weeklyPay * weeks
                  
                  return (
                    <TableRow key={salary.id}>
                      <TableCell>
                        {new Date(salary.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {salary.endDate ? new Date(salary.endDate).toLocaleDateString() : 'Current'}
                      </TableCell>
                      <TableCell>
                        ${salary.weeklyPay.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {weeks} weeks
                      </TableCell>
                      <TableCell>
                        ${totalCost.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}