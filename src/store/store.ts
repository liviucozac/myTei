import { configureStore } from '@reduxjs/toolkit'
import productsReducer from './productsSlice'
import scanReducer from './scanSlice'

export const store = configureStore({
  reducer: {
    products: productsReducer,
    scan: scanReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch