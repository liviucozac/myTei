import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './store'

interface ScanState {
  lastValue: string | null
  selectedProductId: string | null
  status: 'idle' | 'decoding' | 'success' | 'error'
  error?: string
}

const initialState: ScanState = {
  lastValue: null,
  selectedProductId: null,
  status: 'idle',
}

export const normalizeScan = (value: string): string | null => {
  const normalized = value.toLowerCase().trim()
  
  // Check if it's any comenzi.farmaciatei.ro URL
  if (normalized.includes('comenzi.farmaciatei.ro')) {
    // For the specific Marimer product URL, return the product ID
    const marimerUrl = 'https://comenzi.farmaciatei.ro/dispozitive-medicale/aspiratoare-nazale/aspirator-nazal-cu-filtru-baby-1-bucata-marimer-p385227'
    if (normalized === marimerUrl.toLowerCase() || normalized.startsWith(marimerUrl.toLowerCase())) {
      return 'marimer-baby-aspirator'
    }
    
    // For other farmaciatei.ro URLs, you can add more mappings here
    // For now, return null for unknown URLs
    return null
  }
  
  // Keep backward compatibility for existing product IDs
  if (normalized === 'marimer-baby-aspirator') return normalized
  
  return null
}

export const resolveScannedValue = createAsyncThunk(
  'scan/resolveScannedValue',
  async (rawValue: string, { getState, rejectWithValue }) => {
    const productId = normalizeScan(rawValue)
    if (!productId) return rejectWithValue('product_not_found')

    const state = getState() as RootState
    const product = state.products.byId[productId]
    
    // Only proceed if product exists in products.json
    if (!product) return rejectWithValue('product_not_found')

    return { productId, rawValue }
  }
)

const scanSlice = createSlice({
  name: 'scan',
  initialState,
  reducers: {
    setDecoding: (state) => {
      state.status = 'decoding'
      state.error = undefined
    },
    setResult: (state, action: PayloadAction<string>) => {
      state.lastValue = action.payload
      state.status = 'success'
      state.error = undefined
    },
    setError: (state, action: PayloadAction<string>) => {
      state.status = 'error'
      state.error = action.payload
    },
    resetScan: (state) => {
      state.lastValue = null
      state.selectedProductId = null
      state.status = 'idle'
      state.error = undefined
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(resolveScannedValue.pending, (state) => {
        state.status = 'decoding'
        state.error = undefined
      })
      .addCase(resolveScannedValue.fulfilled, (state, action) => {
        state.lastValue = action.payload.rawValue
        state.selectedProductId = action.payload.productId
        state.status = 'success'
        state.error = undefined
      })
      .addCase(resolveScannedValue.rejected, (state, action) => {
        state.status = 'error'
        state.error = (action.payload as string) || 'Unknown error'
      })
  },
})

export const { setDecoding, setResult, setError, resetScan } = scanSlice.actions
export default scanSlice.reducer
