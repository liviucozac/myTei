import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from './store/store'
import { setAll } from './store/productsSlice'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Product from './pages/Product'
import NotFound from './pages/NotFound'
import productsData from './data/products.json'
import './App.css'

export default function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(setAll(productsData))
  }, [dispatch])

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scanner />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}