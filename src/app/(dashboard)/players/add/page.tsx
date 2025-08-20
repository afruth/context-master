"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import type { CreatePlayerInput } from "@/types/hattrick"
import { playersApi, ApiError } from "@/lib/api"
import { HattrickImport } from "@/components/hattrick-import"
import type { HattrickPlayerData } from "@/lib/hattrick-parser"

const positions = [
  "Goalkeeper",
  "Central Defender", 
  "Wingback",
  "Winger",
  "Playmaker",
  "Forward"
]

const specialities = [
  "None",
  "Technical",
  "Quick", 
  "Powerful",
  "Unpredictable",
  "Head specialist"
]

const skillLevels = [
  { value: 0, label: "0 - Non-existent" },
  { value: 1, label: "1 - Disastrous" },
  { value: 2, label: "2 - Wretched" },
  { value: 3, label: "3 - Poor" },
  { value: 4, label: "4 - Weak" },
  { value: 5, label: "5 - Inadequate" },
  { value: 6, label: "6 - Passable" },
  { value: 7, label: "7 - Solid" },
  { value: 8, label: "8 - Excellent" },
  { value: 9, label: "9 - Formidable" },
  { value: 10, label: "10 - Outstanding" },
  { value: 11, label: "11 - Brilliant" },
  { value: 12, label: "12 - Magnificent" },
  { value: 13, label: "13 - World Class" },
  { value: 14, label: "14 - Supernatural" },
  { value: 15, label: "15 - Titanic" },
  { value: 16, label: "16 - Extraterrestrial" },
  { value: 17, label: "17 - Mythical" },
  { value: 18, label: "18 - Magical" },
  { value: 19, label: "19 - Utopian" },
  { value: 20, label: "20 - Divine" }
]

export default function AddPlayerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<Partial<CreatePlayerInput>>({
    name: "",
    ageYears: 17,
    ageDays: 0,
    position: "",
    nationality: "",
    speciality: "None",
    form: 5,
    stamina: 5,
    keeper: 0,
    defending: 0,
    playmaking: 0,
    winger: 0,
    passing: 0,
    scoring: 0,
    setPieces: 0,
    purchaseDate: new Date(),
    purchasePrice: 0,
    fromTeam: "",
    estimatedSaleValue: undefined,
    weeklyPay: undefined
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = "Player name is required"
    }

    if (!formData.position) {
      newErrors.position = "Position is required"
    }

    if (!formData.nationality?.trim()) {
      newErrors.nationality = "Nationality is required"
    }

    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = "Purchase price must be greater than 0"
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "Purchase date is required"
    }

    if (formData.ageYears === undefined || formData.ageYears < 15 || formData.ageYears > 50) {
      newErrors.ageYears = "Age must be between 15 and 50 years"
    }

    if (formData.ageDays === undefined || formData.ageDays < 0 || formData.ageDays > 111) {
      newErrors.ageDays = "Days must be between 0 and 111"
    }

    if (formData.weeklyPay !== undefined && formData.weeklyPay <= 0) {
      newErrors.weeklyPay = "Weekly salary must be greater than 0 if provided"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const playerData = {
        name: formData.name!,
        ageYears: formData.ageYears!,
        ageDays: formData.ageDays!,
        position: formData.position!,
        nationality: formData.nationality!,
        speciality: formData.speciality === "None" ? undefined : formData.speciality,
        form: formData.form!,
        stamina: formData.stamina!,
        keeper: formData.keeper,
        defending: formData.defending,
        playmaking: formData.playmaking,
        winger: formData.winger,
        passing: formData.passing,
        scoring: formData.scoring,
        setPieces: formData.setPieces,
        purchaseDate: formData.purchaseDate!.toISOString(),
        purchasePrice: formData.purchasePrice!,
        fromTeam: formData.fromTeam || undefined,
        estimatedSaleValue: formData.estimatedSaleValue,
        weeklyPay: formData.weeklyPay
      }

      const result = await playersApi.create(playerData)
      
      // Redirect to player detail page
      router.push(`/players/${result.id}`)
      
    } catch (error) {
      console.error("Error creating player:", error)
      if (error instanceof ApiError) {
        setErrors({ submit: error.message })
      } else {
        setErrors({ submit: "Failed to create player. Please try again." })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (key: keyof CreatePlayerInput, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }))
    }
  }

  const handleHattrickImport = (importedData: HattrickPlayerData) => {
    // Update form data with imported values
    const updatedFormData = { ...formData }
    
    if (importedData.name) updatedFormData.name = importedData.name
    if (importedData.ageYears !== undefined) updatedFormData.ageYears = importedData.ageYears
    if (importedData.ageDays !== undefined) updatedFormData.ageDays = importedData.ageDays
    if (importedData.nationality) updatedFormData.nationality = importedData.nationality
    if (importedData.position) updatedFormData.position = importedData.position
    if (importedData.speciality) updatedFormData.speciality = importedData.speciality
    if (importedData.form !== undefined) updatedFormData.form = importedData.form
    if (importedData.stamina !== undefined) updatedFormData.stamina = importedData.stamina
    if (importedData.keeper !== undefined) updatedFormData.keeper = importedData.keeper
    if (importedData.defending !== undefined) updatedFormData.defending = importedData.defending
    if (importedData.playmaking !== undefined) updatedFormData.playmaking = importedData.playmaking
    if (importedData.winger !== undefined) updatedFormData.winger = importedData.winger
    if (importedData.passing !== undefined) updatedFormData.passing = importedData.passing
    if (importedData.scoring !== undefined) updatedFormData.scoring = importedData.scoring
    if (importedData.setPieces !== undefined) updatedFormData.setPieces = importedData.setPieces
    if (importedData.weeklyPay !== undefined) updatedFormData.weeklyPay = importedData.weeklyPay
    if (importedData.fromTeam) updatedFormData.fromTeam = importedData.fromTeam

    setFormData(updatedFormData)
    
    // Clear any validation errors for imported fields
    setErrors({})
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/players">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Player</h1>
          <p className="text-muted-foreground">
            Enter the player details and purchase information
          </p>
        </div>
      </div>

      {/* Hattrick Import */}
      <HattrickImport onImport={handleHattrickImport} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Player identity and basic characteristics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Player Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter player name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Input
                  id="nationality"
                  value={formData.nationality || ""}
                  onChange={(e) => updateFormData("nationality", e.target.value)}
                  placeholder="e.g. Brazil, England, France"
                  className={errors.nationality ? "border-red-500" : ""}
                />
                {errors.nationality && (
                  <p className="text-sm text-red-500">{errors.nationality}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select 
                  value={formData.position || ""} 
                  onValueChange={(value: string) => updateFormData("position", value)}
                >
                  <SelectTrigger className={errors.position ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-sm text-red-500">{errors.position}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="speciality">Speciality</Label>
                <Select 
                  value={formData.speciality || "None"} 
                  onValueChange={(value: string) => updateFormData("speciality", value === "None" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select speciality" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialities.map((speciality) => (
                      <SelectItem key={speciality} value={speciality}>
                        {speciality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Age *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="15"
                      max="50"
                      value={formData.ageYears || ""}
                      onChange={(e) => updateFormData("ageYears", parseInt(e.target.value) || 0)}
                      placeholder="Years"
                      className={errors.ageYears ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      max="111"
                      value={formData.ageDays || ""}
                      onChange={(e) => updateFormData("ageDays", parseInt(e.target.value) || 0)}
                      placeholder="Days"
                      className={errors.ageDays ? "border-red-500" : ""}
                    />
                  </div>
                </div>
                {(errors.ageYears || errors.ageDays) && (
                  <p className="text-sm text-red-500">
                    {errors.ageYears || errors.ageDays}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="form">Form Level</Label>
                <Select 
                  value={formData.form?.toString() || "5"} 
                  onValueChange={(value: string) => updateFormData("form", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stamina">Stamina Level</Label>
                <Select 
                  value={formData.stamina?.toString() || "5"} 
                  onValueChange={(value: string) => updateFormData("stamina", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stamina" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Player Skills</CardTitle>
            <CardDescription>
              Enter the player's skill levels (0-20 scale)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "keeper", label: "Goalkeeper" },
                { key: "defending", label: "Defending" },
                { key: "playmaking", label: "Playmaking" },
                { key: "winger", label: "Winger" },
                { key: "passing", label: "Passing" },
                { key: "scoring", label: "Scoring" },
                { key: "setPieces", label: "Set Pieces" }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label>{label}</Label>
                  <Select 
                    value={formData[key as keyof CreatePlayerInput]?.toString() || "0"} 
                    onValueChange={(value: string) => updateFormData(key as keyof CreatePlayerInput, parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((skill) => (
                        <SelectItem key={skill.value} value={skill.value.toString()}>
                          {skill.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
            <CardDescription>
              Information about the player acquisition
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  value={formData.purchasePrice || ""}
                  onChange={(e) => updateFormData("purchasePrice", parseInt(e.target.value) || 0)}
                  placeholder="Enter purchase price"
                  className={errors.purchasePrice ? "border-red-500" : ""}
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-red-500">{errors.purchasePrice}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate ? formData.purchaseDate.toISOString().split('T')[0] : ""}
                  onChange={(e) => updateFormData("purchaseDate", new Date(e.target.value))}
                  className={errors.purchaseDate ? "border-red-500" : ""}
                />
                {errors.purchaseDate && (
                  <p className="text-sm text-red-500">{errors.purchaseDate}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="estimatedSaleValue">Estimated Sale Value</Label>
                <Input
                  id="estimatedSaleValue"
                  type="number"
                  min="0"
                  value={formData.estimatedSaleValue || ""}
                  onChange={(e) => updateFormData("estimatedSaleValue", parseInt(e.target.value) || undefined)}
                  placeholder="Enter estimated sale value"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Used for profit calculations. If not set, estimated as purchase price + 10%.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyPay">Weekly Salary</Label>
                <Input
                  id="weeklyPay"
                  type="number"
                  min="0"
                  value={formData.weeklyPay || ""}
                  onChange={(e) => updateFormData("weeklyPay", parseInt(e.target.value) || undefined)}
                  placeholder="Enter weekly salary"
                  className={errors.weeklyPay ? "border-red-500" : ""}
                />
                {errors.weeklyPay && (
                  <p className="text-sm text-red-500">{errors.weeklyPay}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Optional: Weekly salary cost for profit calculations.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromTeam">From Team</Label>
              <Input
                id="fromTeam"
                value={formData.fromTeam || ""}
                onChange={(e) => updateFormData("fromTeam", e.target.value)}
                placeholder="Team name (optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        {errors.submit && (
          <div className="text-red-500 text-center">{errors.submit}</div>
        )}
        
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/players">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Player
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}