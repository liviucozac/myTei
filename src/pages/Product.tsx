import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'
import type { Product } from '../store/productsSlice'
import { useState } from 'react'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const product = useSelector<RootState, Product | undefined>((s) => id ? s.products.byId[id] : undefined)

  const [open, setOpen] = useState<Record<string, boolean>>({})
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))

  if (!product) {
    return (
      <div className="container not-found">
        <h2>Product not found</h2>
        <Link to="/scan" className="home-button">Back to Scan</Link>
      </div>
    )
  }

  return (
    <div className="product-page">
      <div className="container">
        <header className="product-header">
          <Link to="/scan" className="back-button">← Back</Link>
          <div className="product-title">
            <h1>{product.name}</h1>
            <div className="product-brand">{product.brand}</div>
          </div>
        </header>

        <div className="product-content">
          <div className="product-main">
            <div className="product-image">
              <img src={product.image} alt={product.name} onError={(e) => ((e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image')} />
            </div>
            <div className="product-info">
              <div className="product-price"><span className="price-label">Price:</span> <span className="price-value">{product.price}</span></div>
              <a className="external-link" href={product.url} target="_blank" rel="noopener noreferrer">Open on Farmacia Tei</a>
            </div>
          </div>

          <div className="product-details">
            <h2>Details</h2>
            {[
              ['uses', 'Uses', product.uses],
              ['ingredients', 'Ingredients', product.ingredients],
              ['contraindications', 'Contraindications', product.contraindications],
              ['dosage', 'Dosage', product.dosage],
              ['storage', 'Storage', product.storage],
              ['warnings', 'Warnings', product.warnings],
            ].map(([key, title, content]) => (
              <div key={key} className="detail-section">
                <button className="section-header" onClick={() => toggle(key)}>
                  {title} <span className="expand-icon">{open[key] ? '−' : '+'}</span>
                </button>
                {open[key] && <div className="section-content">{content}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}