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

  // Exact product URL for Marimer Baby Aspirator
  const marimerUrl =
    "https://comenzi.farmaciatei.ro/dispozitive-medicale/aspiratoare-nazale/aspirator-nazal-cu-filtru-baby-1-bucata-marimer-p385227"

  if (
    normalized === marimerUrl.toLowerCase() ||
    normalized.startsWith(marimerUrl.toLowerCase())
  ) {
    return "marimer-baby-aspirator" // matches your products.json
  }

  // Keep backward compatibility with ID
  if (normalized === "marimer-baby-aspirator") return normalized

  // For other farmaciatei.ro links → return full URL (to trigger fallback)
  if (normalized.includes("comenzi.farmaciatei.ro")) {
    return normalized
  }

  return null
}


// Function to create product data from Farmacia Tei URL (CORS-safe)
const createProductFromUrl = (url: string) => {
  // Extract product ID from URL
  const urlMatch = url.match(/p(\d+)$/)
  const productId = urlMatch ? `farmaciatei-${urlMatch[1]}` : `farmaciatei-${Date.now()}`
  
  // Extract product info from URL path
  const pathParts = url.split('/')
  let productName = 'Farmacia Tei Product'
  let category = 'General'
  
  // Try to extract meaningful info from URL structure
  if (pathParts.length > 3) {
    // Get category from URL path
    const categoryIndex = pathParts.findIndex(part => part.includes('farmaciatei.ro')) + 1
    if (categoryIndex < pathParts.length) {
      category = pathParts[categoryIndex]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'General'
    }
    
    // Try to extract product name from the last meaningful part
    const lastPart = pathParts[pathParts.length - 1]
    if (lastPart && lastPart !== productId.replace('farmaciatei-', 'p')) {
      productName = lastPart
        .replace(/p\d+$/, '') // Remove product ID suffix
        .replace(/-/g, ' ') // Replace dashes with spaces
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
        .trim()
      
      if (!productName) productName = 'Farmacia Tei Product'
    }
  }
  
  // Create a meaningful product object without CORS issues
  const dynamicProduct = {
    id: productId,
    name: productName,
    brand: 'Farmacia Tei',
    url: url,
    price: 'See website for current price',
    image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjA1VjE4MEgxOTVWMTQwSDE3NVYxMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYyMDBIMTYwVjEwMFpNMTgwIDEyMFYxODBIMjIwVjEyMEgxODBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkZhcm1hY2lhIFRlaSBQcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K',
    uses: `This product is available in the ${category} category. For detailed product information, ingredients, and usage instructions, please visit the Farmacia Tei website.`,
    ingredients: 'Complete ingredient list available on the product page and packaging.',
    contraindications: 'Please consult the product information on Farmacia Tei website or consult with a healthcare professional before use.',
    dosage: 'Follow the dosage instructions provided on the product packaging or as recommended by your healthcare provider.',
    storage: 'Store according to the instructions on the product packaging, typically in a cool, dry place away from direct sunlight.',
    warnings: 'Read all warnings and precautions on the product packaging. Keep out of reach of children.',
    codes: [productId, url]
  }
  
  return dynamicProduct
}

export const resolveScannedValue = createAsyncThunk(
  'scan/resolveScannedValue',
  async (rawValue: string, { getState, dispatch, rejectWithValue }) => {
    const productId = normalizeScan(rawValue)
    if (!productId) return rejectWithValue('product_not_found')

    const state = getState() as RootState
    const product = state.products.byId[productId]
    
    // If product exists in local database, use it
    if (product) {
      return { productId, rawValue }
    }
    
    // If it's a farmaciatei.ro URL but not in local database, create product from URL
    if (productId.includes('comenzi.farmaciatei.ro')) {
      const createdProduct = createProductFromUrl(rawValue)
      
      // Add the created product to the store
      const { setAll } = await import('./productsSlice')
      const currentProducts = Object.values(state.products.byId)
      dispatch(setAll([...currentProducts, createdProduct]))
      
      return { productId: createdProduct.id, rawValue }
    }

    return rejectWithValue('product_not_found')
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
