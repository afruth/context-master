/**
 * HattrickImport Component
 * 
 * Allows users to paste Hattrick player export data and import it into the form
 */

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Download, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Import } from "lucide-react"
import { parseHattrickPlayer, getImportSummary, type HattrickPlayerData, type ParseResult } from "@/lib/hattrick-parser"

interface HattrickImportProps {
  onImport: (data: HattrickPlayerData) => void;
  className?: string;
}

export function HattrickImport({ onImport, className = "" }: HattrickImportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleImport = () => {
    if (!importText.trim()) {
      setParseResult({
        success: false,
        errors: ["Please paste some Hattrick player data first"],
        warnings: []
      })
      return
    }

    setIsImporting(true)
    
    // Simulate a brief processing delay for better UX
    setTimeout(() => {
      const result = parseHattrickPlayer(importText)
      setParseResult(result)
      
      if (result.success && result.data) {
        // Call the parent's import handler
        onImport(result.data)
        
        // Clear the text area after successful import
        setImportText("")
        
        // Auto-collapse after successful import
        setTimeout(() => {
          setIsOpen(false)
        }, 2000)
      }
      
      setIsImporting(false)
    }, 300)
  }

  const handleClear = () => {
    setImportText("")
    setParseResult(null)
  }

  const getStatusIcon = () => {
    if (!parseResult) return null
    if (parseResult.success) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (!parseResult) return ""
    return parseResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
  }

  return (
    <Card className={`${className}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <CardTitle className="text-lg">Import from Hattrick</CardTitle>
              <CardDescription>
                Paste exported player data to auto-fill form fields
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {parseResult && (
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className="text-sm text-muted-foreground">
                  {parseResult.success ? "Success" : "Error"}
                </span>
              </div>
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Textarea
                placeholder={`Paste your Hattrick player export here...

Example format:
Cristian Harasim [playerid=475421423]
24 years and 106 days, next birthday: 26.08.2025

Nationality: România
...`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              
              <div className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleClear}
                  disabled={!importText && !parseResult}
                >
                  Clear
                </Button>
                <Button 
                  type="button"
                  onClick={handleImport}
                  disabled={!importText.trim() || isImporting}
                  className="min-w-[100px]"
                >
                  {isImporting ? (
                    <>
                      <Import className="mr-2 h-4 w-4 animate-pulse" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Import className="mr-2 h-4 w-4" />
                      Import Data
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {parseResult && (
              <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
                <div className="flex items-start gap-2">
                  {getStatusIcon()}
                  <div className="flex-1">
                    <div>
                      {parseResult.success ? (
                        <div className="space-y-2">
                          <p className="font-medium text-green-800">
                            Successfully imported player data!
                          </p>
                          {parseResult.data && (
                            <div className="space-y-1">
                              <p className="text-sm text-green-700">
                                Imported: {getImportSummary(parseResult.data).join(", ")}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {getImportSummary(parseResult.data).map((item, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium text-red-800">
                            Import failed
                          </p>
                          <div className="text-sm text-red-700">
                            {parseResult.errors.map((error, index) => (
                              <p key={index}>• {error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show warnings even on success */}
                      {parseResult.warnings.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-current/20">
                          <p className="text-sm font-medium mb-1">
                            Warnings:
                          </p>
                          <div className="text-sm opacity-80">
                            {parseResult.warnings.map((warning, index) => (
                              <p key={index}>• {warning}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">How to use:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Go to your player's page in Hattrick</li>
                <li>Look for the "Export" or copy option</li>
                <li>Copy the player data text</li>
                <li>Paste it in the textarea above</li>
                <li>Click "Import Data" to auto-fill the form</li>
              </ol>
              <p className="text-xs mt-2 opacity-75">
                Tip: The parser will extract name, age, nationality, skills, wage, and other available information.
              </p>
            </div>
        </CardContent>
      )}
    </Card>
  )
}