/**
 * API utility functions for making authenticated requests
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

async function makeRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText)
  }

  const result: ApiResponse<T> = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }

  console.log('makeRequest result:', JSON.stringify(result, null, 2))
  console.log('makeRequest returning:', result.data || (result as T))
  
  return result.data || (result as T)
}

// Player API functions
export const playersApi = {
  getAll: async (params?: {
    // Text search
    search?: string
    
    // Filters
    status?: string
    position?: string
    ageMin?: number
    ageMax?: number
    priceMin?: number
    priceMax?: number
    purchaseDateFrom?: string
    purchaseDateTo?: string
    
    // Skill level filters
    keeperMin?: number
    keeperMax?: number
    defendingMin?: number
    defendingMax?: number
    playmakingMin?: number
    playmakingMax?: number
    wingerMin?: number
    wingerMax?: number
    passingMin?: number
    passingMax?: number
    scoringMin?: number
    scoringMax?: number
    setPiecesMin?: number
    setPiecesMax?: number
    
    // Sorting
    sortBy?: string
    sortOrder?: string
    
    // Pagination
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const url = `/api/players${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    
    // Special handling for players API to return the full response with pagination
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText)
    }

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error)
    }

    return result // Return the full response object with data and pagination
  },

  getById: async (id: string) => {
    const result = await makeRequest(`/api/players/${id}`)
    return result.data || result
  },

  create: async (playerData: any) => {
    const result = await makeRequest(`/api/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    })
    return result.data || result
  },

  update: async (id: string, playerData: any) => {
    return makeRequest(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData),
    })
  },

  delete: async (id: string) => {
    return makeRequest(`/api/players/${id}`, {
      method: 'DELETE',
    })
  },

  getProfitProjection: async (id: string) => {
    return makeRequest(`/api/players/${id}/profit-projection`)
  },
}

// Portfolio API functions
export const portfolioApi = {
  getSummary: async (includeProjections = true) => {
    const params = new URLSearchParams({ includeProjections: includeProjections.toString() })
    const result = await makeRequest(`/api/calculations/portfolio?${params.toString()}`)
    return result.data || result
  },
}

// Transactions API functions
export const transactionsApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    playerId?: string
    startDate?: string
    endDate?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const url = `/api/transactions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return makeRequest(url)
  },

  create: async (transactionData: any) => {
    return makeRequest(`/api/transactions`, {
      method: 'POST',
      body: JSON.stringify(transactionData),
    })
  },

  recordSale: async (saleData: any) => {
    return makeRequest(`/api/transactions/sale`, {
      method: 'POST',
      body: JSON.stringify(saleData),
    })
  },
}

// Analytics API functions
export const analyticsApi = {
  getAnalytics: async (params?: {
    startDate?: string
    endDate?: string
    includeCurrent?: boolean
    includePortfolio?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const url = `/api/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    return makeRequest(url)
  },
}

// User API functions
export const userApi = {
  getProfile: async () => {
    return makeRequest('/api/user')
  },

  updateProfile: async (profileData: {
    name?: string
    email?: string
    username?: string
  }) => {
    return makeRequest('/api/user', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  },

  changePassword: async (passwordData: {
    currentPassword: string
    newPassword: string
  }) => {
    return makeRequest('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
  },
}

// Settings API functions
export const settingsApi = {
  getSettings: async () => {
    return makeRequest('/api/user/settings')
  },

  updateSettings: async (settings: {
    currency?: string
  }) => {
    return makeRequest('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  },
}