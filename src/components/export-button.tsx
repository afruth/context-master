"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File,
  Loader2
} from "lucide-react"

interface ExportButtonProps {
  exportType: 'players' | 'transactions' | 'portfolio'
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  filters?: Record<string, any>
  className?: string
}

export function ExportButton({ 
  exportType, 
  label = "Export",
  variant = "outline",
  size = "default",
  filters = {},
  className = ""
}: ExportButtonProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [open, setOpen] = useState(false)

  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)
      
      // Build query parameters
      const params = new URLSearchParams({
        format,
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            acc[key] = String(value)
          }
          return acc
        }, {} as Record<string, string>)
      })

      // Make request to export API
      const response = await fetch(`/api/export/${exportType}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': getContentType(format)
        }
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Get the filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `hattrick-${exportType}-${new Date().toISOString().split('T')[0]}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      alert(error instanceof Error ? error.message : 'Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getContentType = (format: string) => {
    switch (format) {
      case 'csv': return 'text/csv'
      case 'json': return 'application/json'
      case 'pdf': return 'application/pdf'
      default: return 'text/csv'
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />
      case 'json': return <File className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      default: return <FileSpreadsheet className="h-4 w-4" />
    }
  }

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv': return 'Spreadsheet format (Excel, Google Sheets)'
      case 'json': return 'Complete data with metadata'
      case 'pdf': return 'Professional report format'
      default: return 'Spreadsheet format'
    }
  }

  // For portfolio exports, don't show CSV option
  const availableFormats = exportType === 'portfolio' 
    ? [{ value: 'json', label: 'JSON' }, { value: 'pdf', label: 'PDF' }]
    : [
        { value: 'csv', label: 'CSV' },
        { value: 'json', label: 'JSON' },
        { value: 'pdf', label: 'PDF' }
      ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Export {exportType.charAt(0).toUpperCase() + exportType.slice(1)}</h4>
            <p className="text-sm text-muted-foreground">
              Choose a format to download your data
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={format} onValueChange={(value: 'csv' | 'json' | 'pdf') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    <div className="flex items-center gap-2">
                      {getFormatIcon(fmt.value)}
                      {fmt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {getFormatDescription(format)}
            </p>
          </div>

          {Object.keys(filters).length > 0 && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              <strong>Applied filters:</strong>
              <ul className="list-disc list-inside mt-1">
                {Object.entries(filters).map(([key, value]) => {
                  if (value !== undefined && value !== null && value !== '') {
                    return (
                      <li key={key}>
                        {key}: {String(value)}
                      </li>
                    )
                  }
                  return null
                }).filter(Boolean)}
              </ul>
              {Object.keys(filters).filter(key => 
                filters[key] !== undefined && filters[key] !== null && filters[key] !== ''
              ).length === 0 && (
                <span>No filters applied - exporting all data</span>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}