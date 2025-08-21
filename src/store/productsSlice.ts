import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Product {
  id: string
  nume: string
  codProdus: string
  categorie: string
  stoc: string
  url: string
  pret: string
  image: string
  proprietati: string[]
  modUtilizare: string[]
  precautii: string[]
  dozaj: string
  depozitare: string
  atentie: string
  codes: string[]
}

interface ProductsState {
  byId: Record<string, Product>
  allIds: string[]
}

const initialState: ProductsState = {
  byId: {},
  allIds: [],
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setAll: (state, action: PayloadAction<Product[]>) => {
      state.byId = {}
      state.allIds = []
      action.payload.forEach((p) => {
        state.byId[p.id] = p
        state.allIds.push(p.id)
      })
    },
  },
})

export const { setAll } = productsSlice.actions
export default productsSlice.reducer
