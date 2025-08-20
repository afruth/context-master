/**
 * Component tests for RecordSaleModal
 * Tests form validation, profit calculation display, and success/error handling
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecordSaleModal } from '@/components/record-sale-modal'
import { createMockPlayer } from '../utils/test-helpers'
import type { PlayerWithCalculations } from '@/types/hattrick'

// Mock the API
jest.mock('@/lib/api', () => ({
  transactionsApi: {
    recordSale: jest.fn()
  }
}))

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

describe('RecordSaleModal', () => {
  const mockPlayer: PlayerWithCalculations = {
    ...createMockPlayer({
      id: 'player-1',
      name: 'Test Player',
      position: 'Midfielder',
      age: { years: 20, days: 50 },
      purchaseDetails: {
        date: new Date('2024-01-01'),
        price: 1000000,
        fromTeam: 'Test Team'
      }
    }),
    weeksOwned: 8,
    projectedProfit: 100000,
    currentPercentageKept: 46.5
  }

  const defaultProps = {
    player: mockPlayer,
    open: true,
    onOpenChange: jest.fn(),
    onSaleRecorded: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Render', () => {
    it('should render modal with player information', () => {
      render(<RecordSaleModal {...defaultProps} />)

      expect(screen.getByText('Record Sale - Test Player')).toBeInTheDocument()
      expect(screen.getByText('Midfielder')).toBeInTheDocument()
      expect(screen.getByText('20y 50d')).toBeInTheDocument()
      expect(screen.getByText('$1,000,000')).toBeInTheDocument()
      expect(screen.getByText('8 weeks')).toBeInTheDocument()
    })

    it('should set default sale date to today', () => {
      render(<RecordSaleModal {...defaultProps} />)
      
      const dateInput = screen.getByLabelText('Sale Date *') as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput.value).toBe(today)
    })

    it('should not render when closed', () => {
      render(<RecordSaleModal {...defaultProps} open={false} />)
      
      expect(screen.queryByText('Record Sale - Test Player')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show error for missing sale price', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith(
          'Sale price must be a positive number'
        )
      })
    })

    it('should show error for negative sale price', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '-1000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith(
          'Sale price must be a positive number'
        )
      })
    })

    it('should show error for future sale date', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const dateInput = screen.getByLabelText('Sale Date *')
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      await user.clear(dateInput)
      await user.type(dateInput, futureDate.toISOString().split('T')[0])

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith(
          'Sale date cannot be in the future'
        )
      })
    })

    it('should show error for sale date before purchase date', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const dateInput = screen.getByLabelText('Sale Date *')
      await user.clear(dateInput)
      await user.type(dateInput, '2023-12-31') // Before purchase date (2024-01-01)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith(
          'Sale date cannot be before purchase date'
        )
      })
    })
  })

  describe('Profit Calculation Preview', () => {
    it('should display sale preview when valid price is entered', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      await waitFor(() => {
        expect(screen.getByText('Sale Preview')).toBeInTheDocument()
        expect(screen.getByText('$1,200,000')).toBeInTheDocument() // Sale price
        expect(screen.getByText('46%')).toBeInTheDocument() // Percentage kept (8 weeks * 5% + some rounding)
      })
    })

    it('should calculate net sale value correctly', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1000000')

      await waitFor(() => {
        // With 8 weeks owned, percentage kept should be 40% (8 * 5%)
        // Net sale value: 1000000 * 0.40 = 400000
        const netSaleElements = screen.getAllByText((content, element) => {
          return content.includes('$400,000') && element?.textContent?.includes('Net Sale Value')
        })
        expect(netSaleElements.length).toBeGreaterThan(0)
      })
    })

    it('should show profit/loss calculation', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1500000')

      await waitFor(() => {
        expect(screen.getByText(/Total Profit\/Loss:/)).toBeInTheDocument()
      })
    })

    it('should update preview when price changes', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1000000')

      await waitFor(() => {
        expect(screen.getByText('$1,000,000')).toBeInTheDocument()
      })

      await user.clear(priceInput)
      await user.type(priceInput, '1500000')

      await waitFor(() => {
        expect(screen.getByText('$1,500,000')).toBeInTheDocument()
      })
    })

    it('should hide preview for invalid price', () => {
      render(<RecordSaleModal {...defaultProps} />)

      // No price entered - preview should not be visible
      expect(screen.queryByText('Sale Preview')).not.toBeInTheDocument()
    })
  })

  describe('Confirmation Flow', () => {
    it('should show confirmation when record button is clicked', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Confirm Sale')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to record this sale/)).toBeInTheDocument()
        expect(screen.getByText('Confirm Sale')).toBeInTheDocument() // Button text changes
      })
    })

    it('should allow going back from confirmation', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      await waitFor(() => {
        expect(screen.getByText('Confirm Sale')).toBeInTheDocument()
      })

      const backButton = screen.getByText('Back')
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.queryByText('Confirm Sale')).not.toBeInTheDocument()
        expect(screen.getByText('Record Sale')).toBeInTheDocument()
      })
    })
  })

  describe('Sale Recording', () => {
    it('should record sale successfully', async () => {
      const user = userEvent.setup()
      const mockRecordSale = require('@/lib/api').transactionsApi.recordSale
      mockRecordSale.mockResolvedValueOnce({ success: true })

      render(<RecordSaleModal {...defaultProps} />)

      // Fill form
      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const teamInput = screen.getByLabelText('To Team (Optional)')
      await user.type(teamInput, 'Buyer Team')

      const notesInput = screen.getByLabelText('Notes (Optional)')
      await user.type(notesInput, 'Great sale!')

      // First click - show confirmation
      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      // Second click - confirm sale
      const confirmButton = screen.getByText('Confirm Sale')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockRecordSale).toHaveBeenCalledWith({
          playerId: 'player-1',
          saleDate: expect.any(Date),
          salePrice: 1200000,
          percentageKept: expect.any(Number),
          toTeam: 'Buyer Team',
          notes: 'Great sale!'
        })
      })

      expect(require('sonner').toast.success).toHaveBeenCalled()
      expect(defaultProps.onSaleRecorded).toHaveBeenCalled()
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should handle API errors', async () => {
      const user = userEvent.setup()
      const mockRecordSale = require('@/lib/api').transactionsApi.recordSale
      mockRecordSale.mockRejectedValueOnce(new Error('API Error'))

      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      const confirmButton = screen.getByText('Confirm Sale')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(require('sonner').toast.error).toHaveBeenCalledWith('API Error')
      })
    })

    it('should disable buttons during submission', async () => {
      const user = userEvent.setup()
      const mockRecordSale = require('@/lib/api').transactionsApi.recordSale
      // Mock a slow API call
      mockRecordSale.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)))

      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      const confirmButton = screen.getByText('Confirm Sale')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText('Recording...')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Form Reset', () => {
    it('should reset form when modal is closed', () => {
      const { rerender } = render(<RecordSaleModal {...defaultProps} />)

      // Close modal
      rerender(<RecordSaleModal {...defaultProps} open={false} />)
      
      // Reopen modal
      rerender(<RecordSaleModal {...defaultProps} open={true} />)

      const priceInput = screen.getByLabelText('Sale Price *') as HTMLInputElement
      const teamInput = screen.getByLabelText('To Team (Optional)') as HTMLInputElement
      const notesInput = screen.getByLabelText('Notes (Optional)') as HTMLTextAreaElement

      expect(priceInput.value).toBe('')
      expect(teamInput.value).toBe('')
      expect(notesInput.value).toBe('')
    })

    it('should reset form after successful sale', async () => {
      const user = userEvent.setup()
      const mockRecordSale = require('@/lib/api').transactionsApi.recordSale
      mockRecordSale.mockResolvedValueOnce({ success: true })

      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      const confirmButton = screen.getByText('Confirm Sale')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<RecordSaleModal {...defaultProps} />)

      expect(screen.getByLabelText('Sale Date *')).toBeInTheDocument()
      expect(screen.getByLabelText('Sale Price *')).toBeInTheDocument()
      expect(screen.getByLabelText('To Team (Optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument()
    })

    it('should show required field indicators', () => {
      render(<RecordSaleModal {...defaultProps} />)

      expect(screen.getByText('Sale Date *')).toBeInTheDocument()
      expect(screen.getByText('Sale Price *')).toBeInTheDocument()
    })

    it('should have proper dialog structure', () => {
      render(<RecordSaleModal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Record Sale - Test Player')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero weeks owned', () => {
      const newPlayer = {
        ...mockPlayer,
        weeksOwned: 0
      }

      render(<RecordSaleModal {...defaultProps} player={newPlayer} />)

      expect(screen.getByText('0 weeks')).toBeInTheDocument()
    })

    it('should handle missing optional fields', async () => {
      const user = userEvent.setup()
      const mockRecordSale = require('@/lib/api').transactionsApi.recordSale
      mockRecordSale.mockResolvedValueOnce({ success: true })

      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '1200000')

      const recordButton = screen.getByText('Record Sale')
      await user.click(recordButton)

      const confirmButton = screen.getByText('Confirm Sale')
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockRecordSale).toHaveBeenCalledWith({
          playerId: 'player-1',
          saleDate: expect.any(Date),
          salePrice: 1200000,
          percentageKept: expect.any(Number),
          toTeam: undefined, // Optional field not filled
          notes: undefined   // Optional field not filled
        })
      })
    })

    it('should handle very large sale prices', async () => {
      const user = userEvent.setup()
      render(<RecordSaleModal {...defaultProps} />)

      const priceInput = screen.getByLabelText('Sale Price *')
      await user.type(priceInput, '999999999')

      await waitFor(() => {
        expect(screen.getByText('Sale Preview')).toBeInTheDocument()
        expect(screen.getByText('$999,999,999')).toBeInTheDocument()
      })
    })
  })
})