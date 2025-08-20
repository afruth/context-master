/**
 * Unit tests for API utility functions
 * Tests API response handling, error management, and authentication headers
 */

import { playersApi, portfolioApi, transactionsApi, analyticsApi, ApiError } from '@/lib/api'
import { createMockApiResponse } from './utils/test-helpers'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('API Utility Functions', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError(404, 'Not Found', 'Resource not found')

      expect(error.status).toBe(404)
      expect(error.statusText).toBe('Not Found')
      expect(error.message).toBe('Resource not found')
      expect(error.name).toBe('ApiError')
    })

    it('should create ApiError with default message', () => {
      const error = new ApiError(500, 'Internal Server Error')

      expect(error.message).toBe('API Error: 500 Internal Server Error')
    })
  })

  describe('makeRequest error handling', () => {
    it('should throw ApiError for non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(playersApi.getAll()).rejects.toThrow(ApiError)
      await expect(playersApi.getAll()).rejects.toThrow('API Error: 404 Not Found')
    })

    it('should throw Error for API response errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: 'Validation failed' })
      })

      await expect(playersApi.getAll()).rejects.toThrow('Validation failed')
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(playersApi.getAll()).rejects.toThrow('Network error')
    })
  })

  describe('Request headers and options', () => {
    it('should include correct headers in requests', async () => {
      const mockData = { players: [] }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData })
      })

      await playersApi.getAll()

      expect(mockFetch).toHaveBeenCalledWith('/api/players', {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })

    it('should include body for POST requests', async () => {
      const mockData = { id: '1', name: 'Test Player' }
      const playerData = { name: 'Test Player', position: 'Midfielder' }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData })
      })

      await playersApi.create(playerData)

      expect(mockFetch).toHaveBeenCalledWith('/api/players', {
        method: 'POST',
        body: JSON.stringify(playerData),
        headers: {
          'Content-Type': 'application/json',
        }
      })
    })
  })

  describe('playersApi', () => {
    describe('getAll', () => {
      it('should call correct endpoint without parameters', async () => {
        const mockData = { players: [], pagination: {} }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        const result = await playersApi.getAll()

        expect(mockFetch).toHaveBeenCalledWith('/api/players', expect.any(Object))
        expect(result).toEqual(mockData)
      })

      it('should include query parameters when provided', async () => {
        const mockData = { players: [] }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        await playersApi.getAll({
          status: 'OWNED',
          position: 'Midfielder',
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc'
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/players?status=OWNED&position=Midfielder&page=1&limit=10&sortBy=name&sortOrder=asc',
          expect.any(Object)
        )
      })

      it('should filter out undefined parameters', async () => {
        const mockData = { players: [] }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        await playersApi.getAll({
          status: 'OWNED',
          position: undefined,
          page: 1
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/players?status=OWNED&page=1',
          expect.any(Object)
        )
      })
    })

    describe('getById', () => {
      it('should call correct endpoint with player ID', async () => {
        const mockData = { id: '1', name: 'Test Player' }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockData })
        })

        const result = await playersApi.getById('1')

        expect(mockFetch).toHaveBeenCalledWith('/api/players/1', expect.any(Object))
        expect(result).toEqual(mockData)
      })

      it('should handle response without data wrapper', async () => {
        const mockData = { id: '1', name: 'Test Player' }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        const result = await playersApi.getById('1')

        expect(result).toEqual(mockData)
      })
    })

    describe('create', () => {
      it('should send POST request with player data', async () => {
        const playerData = { name: 'New Player', position: 'Forward' }
        const mockResponse = { id: '2', ...playerData }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockResponse })
        })

        const result = await playersApi.create(playerData)

        expect(mockFetch).toHaveBeenCalledWith('/api/players', {
          method: 'POST',
          body: JSON.stringify(playerData),
          headers: {
            'Content-Type': 'application/json',
          }
        })
        expect(result).toEqual(mockResponse)
      })
    })

    describe('update', () => {
      it('should send PUT request with player data', async () => {
        const playerData = { name: 'Updated Player' }
        const mockResponse = { success: true }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const result = await playersApi.update('1', playerData)

        expect(mockFetch).toHaveBeenCalledWith('/api/players/1', {
          method: 'PUT',
          body: JSON.stringify(playerData),
          headers: {
            'Content-Type': 'application/json',
          }
        })
        expect(result).toEqual(mockResponse)
      })
    })

    describe('delete', () => {
      it('should send DELETE request', async () => {
        const mockResponse = { success: true }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const result = await playersApi.delete('1')

        expect(mockFetch).toHaveBeenCalledWith('/api/players/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        expect(result).toEqual(mockResponse)
      })
    })

    describe('getProfitProjection', () => {
      it('should call correct endpoint for profit projection', async () => {
        const mockData = { projectedProfit: 100000 }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        const result = await playersApi.getProfitProjection('1')

        expect(mockFetch).toHaveBeenCalledWith('/api/players/1/profit-projection', expect.any(Object))
        expect(result).toEqual(mockData)
      })
    })
  })

  describe('portfolioApi', () => {
    describe('getSummary', () => {
      it('should call portfolio endpoint with default parameters', async () => {
        const mockData = { totalValue: 5000000, totalProfit: 200000 }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockData })
        })

        const result = await portfolioApi.getSummary()

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/calculations/portfolio?includeProjections=true',
          expect.any(Object)
        )
        expect(result).toEqual(mockData)
      })

      it('should respect includeProjections parameter', async () => {
        const mockData = { totalValue: 5000000 }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockData })
        })

        await portfolioApi.getSummary(false)

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/calculations/portfolio?includeProjections=false',
          expect.any(Object)
        )
      })
    })
  })

  describe('transactionsApi', () => {
    describe('getAll', () => {
      it('should call transactions endpoint without parameters', async () => {
        const mockData = { transactions: [] }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        const result = await transactionsApi.getAll()

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions', expect.any(Object))
        expect(result).toEqual(mockData)
      })

      it('should include query parameters when provided', async () => {
        const mockData = { transactions: [] }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        await transactionsApi.getAll({
          page: 1,
          limit: 10,
          playerId: 'player-1',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/transactions?page=1&limit=10&playerId=player-1&startDate=2024-01-01&endDate=2024-12-31',
          expect.any(Object)
        )
      })
    })

    describe('create', () => {
      it('should send POST request with transaction data', async () => {
        const transactionData = { type: 'purchase', amount: 1000000 }
        const mockResponse = { id: '1', ...transactionData }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const result = await transactionsApi.create(transactionData)

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(transactionData),
          headers: {
            'Content-Type': 'application/json',
          }
        })
        expect(result).toEqual(mockResponse)
      })
    })

    describe('recordSale', () => {
      it('should send POST request to sale endpoint', async () => {
        const saleData = { 
          playerId: 'player-1', 
          salePrice: 1200000, 
          saleDate: new Date() 
        }
        const mockResponse = { success: true, profitLoss: 100000 }
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const result = await transactionsApi.recordSale(saleData)

        expect(mockFetch).toHaveBeenCalledWith('/api/transactions/sale', {
          method: 'POST',
          body: JSON.stringify(saleData),
          headers: {
            'Content-Type': 'application/json',
          }
        })
        expect(result).toEqual(mockResponse)
      })
    })
  })

  describe('analyticsApi', () => {
    describe('getAnalytics', () => {
      it('should call analytics endpoint without parameters', async () => {
        const mockData = { totalPlayers: 10, avgProfit: 50000 }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        const result = await analyticsApi.getAnalytics()

        expect(mockFetch).toHaveBeenCalledWith('/api/analytics', expect.any(Object))
        expect(result).toEqual(mockData)
      })

      it('should include query parameters when provided', async () => {
        const mockData = { analytics: {} }
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        })

        await analyticsApi.getAnalytics({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          includeCurrent: true
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/analytics?startDate=2024-01-01&endDate=2024-12-31&includeCurrent=true',
          expect.any(Object)
        )
      })
    })
  })

  describe('Response parsing', () => {
    it('should return data property when present', async () => {
      const mockData = { test: 'data' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData, message: 'Success' })
      })

      const result = await playersApi.getAll()

      expect(result).toEqual(mockData)
    })

    it('should return full response when data property absent', async () => {
      const mockResponse = { test: 'data', message: 'Success' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await playersApi.getAll()

      expect(result).toEqual(mockResponse)
    })

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      })

      const result = await playersApi.getAll()

      expect(result).toEqual({})
    })
  })
})