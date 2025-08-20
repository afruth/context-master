"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { PlayerQueryParams } from "@/types/hattrick"
import type { SortField, SortDirection } from "@/components/filters/SortControls"

const defaultFilters: PlayerQueryParams = {
  page: 1,
  limit: 50,
  sortBy: 'purchaseDate',
  sortOrder: 'desc'
}

export function usePlayerFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<PlayerQueryParams>(defaultFilters)
  const [isLoading, setIsLoading] = useState(false)

  // Parse URL parameters on mount and when URL changes
  useEffect(() => {
    const newFilters: PlayerQueryParams = { ...defaultFilters }
    
    // Parse all possible filter parameters from URL
    const urlParams = Object.fromEntries(searchParams.entries())
    
    // Text search
    if (urlParams.search) newFilters.search = urlParams.search
    
    // Basic filters
    if (urlParams.status) newFilters.status = urlParams.status as any
    if (urlParams.position) newFilters.position = urlParams.position
    
    // Age range
    if (urlParams.ageMin) newFilters.ageMin = parseInt(urlParams.ageMin)
    if (urlParams.ageMax) newFilters.ageMax = parseInt(urlParams.ageMax)
    
    // Price range
    if (urlParams.priceMin) newFilters.priceMin = parseInt(urlParams.priceMin)
    if (urlParams.priceMax) newFilters.priceMax = parseInt(urlParams.priceMax)
    
    // Purchase date range
    if (urlParams.purchaseDateFrom) newFilters.purchaseDateFrom = urlParams.purchaseDateFrom
    if (urlParams.purchaseDateTo) newFilters.purchaseDateTo = urlParams.purchaseDateTo
    
    // Skill filters
    const skills = ['keeper', 'defending', 'playmaking', 'winger', 'passing', 'scoring', 'setPieces']
    skills.forEach(skill => {
      const minKey = `${skill}Min` as keyof PlayerQueryParams
      const maxKey = `${skill}Max` as keyof PlayerQueryParams
      if (urlParams[minKey]) (newFilters as any)[minKey] = parseInt(urlParams[minKey])
      if (urlParams[maxKey]) (newFilters as any)[maxKey] = parseInt(urlParams[maxKey])
    })
    
    // Sorting
    if (urlParams.sortBy) newFilters.sortBy = urlParams.sortBy as any
    if (urlParams.sortOrder) newFilters.sortOrder = urlParams.sortOrder as any
    
    // Pagination
    if (urlParams.page) newFilters.page = parseInt(urlParams.page)
    if (urlParams.limit) newFilters.limit = parseInt(urlParams.limit)
    
    setFilters(newFilters)
  }, [searchParams])

  // Update URL when filters change
  const updateURL = useCallback((newFilters: PlayerQueryParams) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && 
          !(key === 'page' && value === 1) && 
          !(key === 'limit' && value === 50) &&
          !(key === 'sortBy' && value === 'purchaseDate') &&
          !(key === 'sortOrder' && value === 'desc')) {
        params.set(key, value.toString())
      }
    })
    
    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    
    router.replace(newUrl, { scroll: false })
  }, [pathname, router])

  // Update filters and URL
  const updateFilters = useCallback((updates: Partial<PlayerQueryParams>) => {
    const newFilters = { 
      ...filters, 
      ...updates,
      // Reset to page 1 when filters change (except when explicitly updating page)
      page: 'page' in updates ? updates.page : 1
    }
    
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    updateURL(defaultFilters)
  }, [updateURL])

  // Clear specific filter
  const clearFilter = useCallback((key: keyof PlayerQueryParams) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    
    setFilters(newFilters)
    updateURL(newFilters)
  }, [filters, updateURL])

  // Update search with debouncing
  const updateSearch = useCallback((search: string) => {
    updateFilters({ search: search || undefined })
  }, [updateFilters])

  // Update sort
  const updateSort = useCallback((sortBy: SortField, sortOrder: SortDirection) => {
    updateFilters({ sortBy, sortOrder })
  }, [updateFilters])

  // Update pagination
  const updatePagination = useCallback((page: number, limit?: number) => {
    const updates: Partial<PlayerQueryParams> = { page }
    if (limit) updates.limit = limit
    updateFilters(updates)
  }, [updateFilters])

  return {
    filters,
    isLoading,
    setIsLoading,
    updateFilters,
    clearFilters,
    clearFilter,
    updateSearch,
    updateSort,
    updatePagination
  }
}