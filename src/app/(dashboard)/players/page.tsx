"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  PlusCircle, 
  Eye, 
  Edit, 
  Trash2, 
  ShoppingCart,
  Search,
  Filter,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import type { PlayerWithCalculations, PlayerStatus } from "@/types/hattrick"

// Mock data - replace with actual API calls
const mockPlayers: PlayerWithCalculations[] = [
  {
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
      defending: 4
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
    salaryHistory: []
  },
  {
    id: "2",
    name: "Marcus Johnson",
    age: { years: 19, days: 12 },
    position: "Central Defender",
    nationality: "England",
    form: 7,
    stamina: 8,
    skills: {
      defending: 8,
      playmaking: 5,
      passing: 6
    },
    purchaseDetails: {
      date: new Date("2024-06-01"),
      price: 220000,
      fromTeam: "Chelsea Youth",
      hattrickWeek: 2,
      hattrickSeason: 85
    },
    currentStatus: "SOLD" as PlayerStatus,
    userId: "user1",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-08-12"),
    totalProfit: 65000,
    profitMargin: 29.5,
    weeksOwned: 10,
    saleTransactions: [{
      id: "sale1",
      playerId: "2",
      saleDate: new Date("2024-08-12"),
      salePrice: 285000,
      percentageKept: 85,
      toTeam: "Real Madrid C",
      hattrickWeek: 11,
      hattrickSeason: 85,
      profitLoss: 65000
    }],
    salaryHistory: []
  },
  {
    id: "3",
    name: "Pierre Dubois",
    age: { years: 17, days: 89 },
    position: "Playmaker",
    nationality: "France",
    speciality: "Technical",
    form: 9,
    stamina: 6,
    skills: {
      playmaking: 10,
      passing: 8,
      scoring: 5
    },
    purchaseDetails: {
      date: new Date("2024-08-10"),
      price: 95000,
      fromTeam: "PSG Youth",
      hattrickWeek: 12,
      hattrickSeason: 85
    },
    currentStatus: "OWNED" as PlayerStatus,
    userId: "user1",
    createdAt: new Date("2024-08-10"),
    updatedAt: new Date("2024-08-10"),
    estimatedProfit: 125000,
    currentValue: 220000,
    weeksOwned: 1,
    saleTransactions: [],
    salaryHistory: []
  }
]

type SortField = 'name' | 'position' | 'age' | 'purchasePrice' | 'estimatedProfit' | 'weeksOwned'
type SortDirection = 'asc' | 'desc'

export default function PlayersPage() {
  const [players] = useState<PlayerWithCalculations[]>(mockPlayers)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Filter and sort players
  const filteredPlayers = players.filter(player => {
    const matchesStatus = statusFilter === "all" || player.currentStatus.toLowerCase() === statusFilter
    const matchesPosition = positionFilter === "all" || player.position.toLowerCase() === positionFilter.toLowerCase()
    const matchesSearch = searchQuery === "" || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.nationality.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPosition && matchesSearch
  }).sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'position':
        aValue = a.position.toLowerCase()
        bValue = b.position.toLowerCase()
        break
      case 'age':
        aValue = a.age.years * 365 + a.age.days
        bValue = b.age.years * 365 + b.age.days
        break
      case 'purchasePrice':
        aValue = a.purchaseDetails.price
        bValue = b.purchaseDetails.price
        break
      case 'estimatedProfit':
        aValue = a.estimatedProfit || a.totalProfit || 0
        bValue = b.estimatedProfit || b.totalProfit || 0
        break
      case 'weeksOwned':
        aValue = a.weeksOwned || 0
        bValue = b.weeksOwned || 0
        break
      default:
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? <TrendingUp className="h-3 w-3 ml-1" /> : <TrendingDown className="h-3 w-3 ml-1" />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground">
            Manage your player portfolio and track performance
          </p>
        </div>
        <Button asChild>
          <Link href="/players/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Player
          </Link>
        </Button>
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
                  placeholder="Search players by name or nationality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                <SelectItem value="central defender">Central Defender</SelectItem>
                <SelectItem value="wingback">Wingback</SelectItem>
                <SelectItem value="winger">Winger</SelectItem>
                <SelectItem value="playmaker">Playmaker</SelectItem>
                <SelectItem value="forward">Forward</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Players Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Player Portfolio</CardTitle>
              <CardDescription>
                {filteredPlayers.length} of {players.length} players
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
                  onClick={() => handleSort('name')}
                >
                  Player {getSortIcon('name')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center">
                    Position {getSortIcon('position')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('age')}
                >
                  <div className="flex items-center">
                    Age {getSortIcon('age')}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('purchasePrice')}
                >
                  <div className="flex items-center">
                    Purchase Price {getSortIcon('purchasePrice')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('estimatedProfit')}
                >
                  <div className="flex items-center">
                    Profit Projection {getSortIcon('estimatedProfit')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('weeksOwned')}
                >
                  <div className="flex items-center">
                    Weeks Owned {getSortIcon('weeksOwned')}
                  </div>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{player.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {player.nationality}
                        {player.speciality && ` • ${player.speciality}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>
                    {player.age.years}y {player.age.days}d
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        player.currentStatus === 'OWNED' ? 'success' : 
                        player.currentStatus === 'SOLD' ? 'secondary' : 'outline'
                      }
                    >
                      {player.currentStatus.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ${player.purchaseDetails.price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {player.currentStatus === 'OWNED' && player.estimatedProfit !== undefined ? (
                      <div className={`flex flex-col ${player.estimatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">
                          {player.estimatedProfit >= 0 ? '+' : ''}${player.estimatedProfit.toLocaleString()}
                        </span>
                        <span className="text-xs">
                          Current: ${player.currentValue?.toLocaleString()}
                        </span>
                      </div>
                    ) : player.currentStatus === 'SOLD' && player.totalProfit !== undefined ? (
                      <div className={`flex flex-col ${player.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="font-medium">
                          {player.totalProfit >= 0 ? '+' : ''}${player.totalProfit.toLocaleString()}
                        </span>
                        <span className="text-xs">
                          {player.profitMargin?.toFixed(1)}% margin
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.weeksOwned || 0} weeks
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/players/${player.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/players/${player.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {player.currentStatus === 'OWNED' && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/players/${player.id}/sell`}>
                            <ShoppingCart className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}

                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No players found matching your criteria.</p>
              <Button className="mt-4" asChild>
                <Link href="/players/add">Add Your First Player</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}