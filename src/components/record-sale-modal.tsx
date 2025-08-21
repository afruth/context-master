"use client"

import * as React from "react"
import { useState } from "react"
import { DollarSign, Target, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PlayerWithCalculations, CreateSaleTransactionInput } from "@/types/hattrick"
import { transactionsApi } from "@/lib/api"
import { calculateWeeksOwned, calculateSalaryCostForPeriod, calculatePercentageKept } from "@/lib/calculations"
import { toast } from "sonner"
import { useCurrency } from "@/hooks/use-settings"
import { formatCurrency } from "@/lib/utils"

interface RecordSaleModalProps {
  player: PlayerWithCalculations
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaleRecorded: () => void
}

interface SaleFormData {
  saleDate: string
  salePrice: string
  toTeam: string
  notes: string
}

interface SalePreview {
  salePrice: number
  percentageKept: number
  netSaleValue: number
  totalSalaryCost: number
  purchasePrice: number
  profitLoss: number
  profitMargin: number
}

export function RecordSaleModal({ player, open, onOpenChange, onSaleRecorded }: RecordSaleModalProps) {
  const { currency } = useCurrency()
  const [formData, setFormData] = useState<SaleFormData>({
    saleDate: new Date().toISOString().split('T')[0],
    salePrice: '',
    toTeam: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // This function is no longer needed - we use user input directly

  // Calculate sale preview with automatic percentage calculation
  const calculateSalePreview = (): SalePreview | null => {
    const salePrice = parseFloat(formData.salePrice)
    
    if (isNaN(salePrice) || salePrice <= 0) return null
    if (!formData.saleDate) return null

    // Calculate weeks owned from purchase date to sale date
    const saleDate = new Date(formData.saleDate)
    const purchaseDate = new Date(player.purchaseDetails.date)
    
    // Calculate ownership duration
    const weeksOwnedResult = calculateWeeksOwned({
      purchaseDate,
      saleDate
    })

    // Calculate percentage kept automatically based on ownership duration
    const percentageKeptResult = calculatePercentageKept({
      daysOwned: weeksOwnedResult.daysOwned
    })
    const percentageKept = percentageKeptResult.percentageKept

    const netSaleValue = (salePrice * percentageKept) / 100
    
    // Calculate total salary cost for the ownership period
    // Convert salary history dates from strings to Date objects
    const salaryHistoryWithDates = player.salaryHistory.map(sh => ({
      ...sh,
      startDate: new Date(sh.startDate),
      endDate: sh.endDate ? new Date(sh.endDate) : undefined,
      createdAt: new Date(sh.createdAt),
      updatedAt: new Date(sh.updatedAt)
    }))
    
    const totalSalaryCost = calculateSalaryCostForPeriod(
      salaryHistoryWithDates,
      purchaseDate,
      saleDate
    )

    const purchasePrice = player.purchaseDetails.price
    const profitLoss = netSaleValue - purchasePrice - totalSalaryCost
    const profitMargin = purchasePrice > 0 ? (profitLoss / purchasePrice) * 100 : 0

    return {
      salePrice,
      percentageKept,
      netSaleValue,
      totalSalaryCost,
      purchasePrice,
      profitLoss,
      profitMargin
    }
  }

  const salePreview = calculateSalePreview()

  const handleInputChange = (field: keyof SaleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.saleDate) {
      errors.push("Sale date is required")
    }
    
    const salePrice = parseFloat(formData.salePrice)
    if (isNaN(salePrice) || salePrice <= 0) {
      errors.push("Sale price must be a positive number")
    }

    // Check if sale date is not in the future
    const saleDate = new Date(formData.saleDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    if (saleDate > today) {
      errors.push("Sale date cannot be in the future")
    }

    // Check if sale date is not before purchase date
    const purchaseDate = new Date(player.purchaseDetails.date)
    if (saleDate < purchaseDate) {
      errors.push("Sale date cannot be before purchase date")
    }

    return errors
  }

  const handleSubmit = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
      return
    }

    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    if (!salePreview) {
      toast.error("Invalid sale data")
      return
    }

    setIsSubmitting(true)

    try {
      const saleData: CreateSaleTransactionInput = {
        playerId: player.id,
        saleDate: new Date(formData.saleDate),
        salePrice: salePreview.salePrice,
        // percentageKept will be calculated automatically in the API
        toTeam: formData.toTeam || undefined,
        notes: formData.notes || undefined
      }

      // Use the API utility function
      await transactionsApi.recordSale(saleData)

      toast.success(`Sale recorded successfully! ${salePreview.profitLoss >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(Math.abs(salePreview.profitLoss), currency)}`)
      onSaleRecorded()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        saleDate: new Date().toISOString().split('T')[0],
        salePrice: '',
        toTeam: '',
        notes: ''
      })
      setShowConfirmation(false)

    } catch (error) {
      console.error('Error recording sale:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to record sale')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
    } else {
      onOpenChange(false)
      setFormData({
        saleDate: new Date().toISOString().split('T')[0],
        salePrice: '',
        toTeam: '',
        notes: ''
      })
      setShowConfirmation(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Sale - {player.name}
          </DialogTitle>
          <DialogDescription>
            Record the sale of this player and calculate the final profit/loss
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Player Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Position:</span>
                  <span className="ml-2 font-medium">{player.position}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age:</span>
                  <span className="ml-2 font-medium">{player.age.years}y {player.age.days}d</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span className="ml-2 font-medium">{formatCurrency(player.purchaseDetails.price, currency)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Weeks Owned:</span>
                  <span className="ml-2 font-medium">{player.weeksOwned || 0} weeks</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => handleInputChange('saleDate', e.target.value)}
                  min={new Date(player.purchaseDetails.date).toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Must be on or after purchase date ({new Date(player.purchaseDetails.date).toLocaleDateString()})
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="0"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange('salePrice', e.target.value)}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage kept will be calculated automatically based on ownership duration
                </p>
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="toTeam">To Team (Optional)</Label>
              <Input
                id="toTeam"
                placeholder="Team name"
                value={formData.toTeam}
                onChange={(e) => handleInputChange('toTeam', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the sale..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Sale Preview */}
          {salePreview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Sale Preview
                </CardTitle>
                <CardDescription>
                  Calculated profit/loss for this transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sale Price:</span>
                    <span className="font-medium">{formatCurrency(salePreview.salePrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage Kept:</span>
                    <span className="font-medium">{salePreview.percentageKept}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Sale Value:</span>
                    <span className="font-medium">{formatCurrency(salePreview.netSaleValue, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price:</span>
                    <span className="font-medium">-{formatCurrency(salePreview.purchasePrice, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salary Costs:</span>
                    <span className="font-medium">-{formatCurrency(salePreview.totalSalaryCost, currency)}</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-2 border-t">
                    <span className="font-medium">Total Profit/Loss:</span>
                    <div className="text-right">
                      <div className={`font-bold ${salePreview.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(salePreview.profitLoss, currency, { showSign: true })}
                      </div>
                      <div className={`text-xs ${salePreview.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {salePreview.profitMargin >= 0 ? '+' : ''}{salePreview.profitMargin.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Message */}
          {showConfirmation && salePreview && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Confirm Sale</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Are you sure you want to record this sale? This will mark the player as SOLD and cannot be undone.
                  <br />
                  <strong>Final {salePreview.profitLoss >= 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(salePreview.profitLoss), currency)}</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            {showConfirmation ? 'Back' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!salePreview || isSubmitting}
            variant={showConfirmation ? "destructive" : "default"}
          >
            {isSubmitting ? 'Recording...' : showConfirmation ? 'Confirm Sale' : 'Record Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}