"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign
} from "lucide-react"
import { transactionsApi, playersApi, ApiError } from "@/lib/api"
import { TableSkeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/export-button"

type SortField = 'date' | 'profitLoss' | 'amount' | 'playerName'
type SortDirection = 'asc' | 'desc'
type TransactionType = 'all' | 'purchases' | 'sales'

interface Transaction {
  id: string
  playerName: string
  type: 'purchase' | 'sale'
  amount: number
  date: string
  team: string
  position: string
  nationality?: string
  profit?: number | null
  percentageKept?: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<TransactionType>("all")
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch both sales and purchases
        const [salesResult, playersResult] = await Promise.all([
          transactionsApi.getAll({ limit: 100 }),
          playersApi.getAll({ limit: 100, sortBy: 'purchaseDate', sortOrder: 'desc' })
        ])
        
        // Transform sales data
        const sales: Transaction[] = (salesResult.data || []).map((transaction: any) => ({
          id: `sale-${transaction.id}`,
          playerName: transaction.player?.name || 'Unknown Player',
          type: 'sale' as const,
          amount: transaction.salePrice || 0,
          date: transaction.saleDate,
          team: transaction.toTeam || 'Unknown',
          position: transaction.player?.position || 'Unknown',
          nationality: transaction.player?.nationality,
          profit: transaction.profitLoss,
          percentageKept: transaction.percentageKept
        }))
        
        // Transform purchases data
        const purchases: Transaction[] = (playersResult.data || []).map((player: any) => ({
          id: `purchase-${player.id}`,
          playerName: player.name || 'Unknown Player',
          type: 'purchase' as const,
          amount: player.purchaseDetails?.price || 0,
          date: player.purchaseDetails?.date || new Date().toISOString(),
          team: player.purchaseDetails?.fromTeam || 'Free Agent',
          position: player.position || 'Unknown',
          nationality: player.nationality,
          profit: null,
          percentageKept: undefined
        }))
        
        // Combine and sort transactions
        const allTransactions = [...sales, ...purchases]
        setTransactions(allTransactions)
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof ApiError ? err.message : 'Failed to fetch transactions')
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = !searchQuery || 
        transaction.playerName?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = typeFilter === "all" || 
        (typeFilter === "purchases" && transaction.type === "purchase") ||
        (typeFilter === "sales" && transaction.type === "sale")
      
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = a.amount || 0
          bValue = b.amount || 0
          break
        case 'playerName':
          aValue = a.playerName?.toLowerCase() || ''
          bValue = b.playerName?.toLowerCase() || ''
          break
        case 'profitLoss':
          aValue = a.profit || 0
          bValue = b.profit || 0
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />
  }

  // Calculate summary statistics
  const salesTransactions = filteredTransactions.filter(t => t.type === 'sale')
  const purchaseTransactions = filteredTransactions.filter(t => t.type === 'purchase')
  const totalProfit = salesTransactions.reduce((sum, t) => sum + (t.profit || 0), 0)
  const successfulTransactions = salesTransactions.filter(t => (t.profit || 0) > 0)
  const successRate = salesTransactions.length > 0 ? (successfulTransactions.length / salesTransactions.length) * 100 : 0
  const averageProfit = salesTransactions.length > 0 ? totalProfit / salesTransactions.length : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Track all your player purchases and sales
          </p>
        </div>
        <ExportButton 
          exportType="transactions"
          label="Export Transactions"
          filters={{
            search: searchQuery,
            sortBy: sortField,
            sortOrder: sortDirection
          }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              Total purchases and sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalProfit >= 0 ? 'text-profit' : 'text-loss'
            }`}>
              {totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Net profit from all sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Profitable transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              averageProfit >= 0 ? 'text-profit' : 'text-loss'
            }`}>
              {averageProfit >= 0 ? '+' : ''}${averageProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by player name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="purchases">Purchases Only</SelectItem>
                <SelectItem value="sales">Sales Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {filteredTransactions.length} of {transactions.length} transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer select-none flex items-center"
                  onClick={() => handleSort('playerName')}
                >
                  Player {getSortIcon('playerName')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Position</TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date {getSortIcon('date')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount {getSortIcon('amount')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('profitLoss')}
                >
                  <div className="flex items-center">
                    Profit/Loss {getSortIcon('profitLoss')}
                  </div>
                </TableHead>
                <TableHead>Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton rows={6} cols={7} />
              ) : filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{transaction.playerName}</span>
                      {transaction.nationality && (
                        <span className="text-sm text-muted-foreground">
                          {transaction.nationality}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'purchase' ? 'secondary' : 'success'}>
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.position}</TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    ${(transaction.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {transaction.profit !== null && transaction.profit !== undefined ? (
                      <div className={`flex flex-col ${transaction.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                        <span className="font-medium">
                          {transaction.profit >= 0 ? '+' : ''}${transaction.profit.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.team || 'Unknown'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}

          {!loading && !error && filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found matching your criteria.</p>
              <Button className="mt-4" onClick={() => {
                setSearchQuery("")
                setTypeFilter("all")
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}