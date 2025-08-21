"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { Button } from "@/components/ui/button"
import { 
  Brain,
  TrendingUp,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Calculator
} from "lucide-react"
import type { SkillPredictionResult, PlayerSkills, PlayerAge } from "@/types/hattrick"
import { getSkillPrediction } from "@/lib/skill-prediction"
import { useCurrency } from "@/hooks/use-settings"

interface SkillPredictionProps {
  skills: PlayerSkills
  age: PlayerAge
  wage?: number
  tsi?: number
  currencyRate?: number // Default 1.0 for USD
  className?: string
}

export function SkillPrediction({
  skills,
  age,
  wage,
  tsi,
  currencyRate = 1.0,
  className
}: SkillPredictionProps) {
  const { currency } = useCurrency()
  const [showDebug, setShowDebug] = useState(false)
  const [prediction, setPrediction] = useState<SkillPredictionResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculatePrediction = async () => {
    if (!wage || wage < 270) {
      return
    }

    setIsCalculating(true)
    try {
      const result = getSkillPrediction({
        skills,
        age,
        wage,
        tsi,
        currencyRate
      })
      setPrediction(result)
    } catch (error) {
      console.error('Error calculating skill prediction:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  // Show calculate button if no prediction yet
  if (!prediction) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Skill Prediction
          </CardTitle>
          <CardDescription>
            Predict main skill level based on wage and age using Foxtrick&apos;s PsicoTSI algorithm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!wage || wage < 270 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Wage information required (minimum 270) for skill prediction
              </span>
            </div>
          ) : (
            <Button 
              onClick={calculatePrediction}
              disabled={isCalculating}
              className="w-full"
            >
              <Calculator className="mr-2 h-4 w-4" />
              {isCalculating ? 'Calculating...' : 'Calculate Skill Prediction'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  if (!prediction.isDetectable) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Skill Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to detect main skill from current wage and skill data</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPrediction(null)}
            className="mt-3"
          >
            Recalculate
          </Button>
        </CardContent>
      </Card>
    )
  }

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'High': return 'success'
      case 'Medium': return 'secondary' 
      case 'Low': return 'destructive'
      default: return 'outline'
    }
  }

  const formatSkillLevel = (level: number) => {
    return level.toFixed(2)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Skill Prediction
            </CardTitle>
            <CardDescription>
              Based on Foxtrick&apos;s PsicoTSI algorithm
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPrediction(null)}
          >
            Recalculate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Prediction */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <div className="font-medium text-lg">
              {prediction.predictedMainSkill}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Predicted main skill</span>
              <Badge variant={getConfidenceBadgeVariant(prediction.confidence) as 'success' | 'secondary' | 'destructive'}>
                {prediction.confidence} confidence
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl">
              {formatSkillLevel(prediction.predictedSkillLevel.avg)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatSkillLevel(prediction.predictedSkillLevel.low)} - {formatSkillLevel(prediction.predictedSkillLevel.high)}
            </div>
          </div>
        </div>

        {/* Wage-based Prediction Details */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wage Prediction (Low)</span>
            <span className="font-medium">{prediction.wagePrediction.low}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wage Prediction (Avg)</span>
            <span className="font-medium">{prediction.wagePrediction.avg}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Wage Prediction (High)</span>
            <span className="font-medium">{prediction.wagePrediction.high}</span>
          </div>
        </div>

        {/* TSI Prediction if available */}
        {prediction.tsiPrediction && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">TSI-Based Prediction</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TSI Low</span>
                <span className="font-medium">{formatSkillLevel(prediction.tsiPrediction.low)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TSI Average</span>
                <span className="font-medium">{formatSkillLevel(prediction.tsiPrediction.avg)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TSI High</span>
                <span className="font-medium">{formatSkillLevel(prediction.tsiPrediction.high)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Accuracy Information */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-blue-900 dark:text-blue-100">
              About this prediction
            </div>
            <div className="text-blue-700 dark:text-blue-200 mt-1">
              {prediction.confidence === 'High' && 
                'High confidence prediction based on strong wage correlation and skill data.'
              }
              {prediction.confidence === 'Medium' && 
                'Medium confidence prediction. Consider additional factors like training or recent transfers.'
              }
              {prediction.confidence === 'Low' && 
                'Low confidence prediction. The wage may not clearly indicate a single main skill.'
              }
            </div>
          </div>
        </div>

        {/* Debug Information Toggle */}
        {prediction.debugInfo && (
          <div className="border-t pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="w-full justify-between"
            >
              <span>Debug Information</span>
              {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showDebug && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Wage</span>
                  <span className="font-mono">{prediction.debugInfo.originalWage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currency.name} ({currency.code})</span>
                    {currency.rate !== 1.0 && (
                      <span className="text-xs text-muted-foreground">
                        1 USD = {(1 / currency.rate).toFixed(currency.rate < 0.01 ? 0 : 2)} {currency.code}
                      </span>
                    )}
                  </div>
                </div>
                {prediction.debugInfo.conversionExplanation && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion</span>
                    <span className="font-mono text-xs">{prediction.debugInfo.conversionExplanation}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wage in USD</span>
                  <span className="font-mono">${prediction.debugInfo.wageInUSD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adjusted Wage (USD)</span>
                  <span className="font-mono">${prediction.debugInfo.adjustedWage.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Main Skill Index</span>
                  <span className="font-mono">{prediction.debugInfo.mainSkillIndex}</span>
                </div>
                
                {Object.keys(prediction.debugInfo.wageBreakdown).length > 0 && (
                  <>
                    <div className="text-muted-foreground font-medium mt-2">Wage Breakdown:</div>
                    {Object.entries(prediction.debugInfo.wageBreakdown).map(([skill, wage]) => (
                      <div key={skill} className="flex justify-between pl-2">
                        <span className="text-muted-foreground">{skill}</span>
                        <span className="font-mono">${wage.toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SkillPrediction