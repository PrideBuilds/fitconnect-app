import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

// Mock fetch
global.fetch = vi.fn()

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('renders FitConnect heading', () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ status: 'healthy', message: 'FitConnect API is running', version: '1.0.0' })
    })
    
    render(<App />)
    expect(screen.getByText('FitConnect')).toBeInTheDocument()
  })

  it('displays backend connection status after successful API call', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ status: 'healthy', message: 'FitConnect API is running', version: '1.0.0' })
    })
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Backend Connected')).toBeInTheDocument()
    })
  })

  it('displays error message when API call fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    render(<App />)
    
    await waitFor(() => {
      expect(screen.getByText('Backend Connection Failed')).toBeInTheDocument()
    })
  })
})
