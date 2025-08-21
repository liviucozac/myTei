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
            <h1>{product.nume}</h1>
            <div className="product-brand">{product.categorie}</div>
          </div>
        </header>

        <div className="product-content">
          <div className="product-main">
            <div className="product-image">
              <img 
                src={product.image} 
                alt={product.nume} 
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxNDBIMjA1VjE4MEgxOTVWMTQwSDE3NVYxMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0xNjAgMTAwSDI0MFYyMDBIMTYwVjEwMFpNMTgwIDEyMFYxODBIMjIwVjEyMEgxODBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjQwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkZhcm1hY2lhIFRlaSBQcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K'
                }} 
              />
            </div>
            <div className="product-info">
              <div className="product-price"><span className="price-label">Preț:</span> <span className="price-value">{product.pret}</span></div>
              <a className="external-link" href={product.url} target="_blank" rel="noopener noreferrer">Verifică produsul pe siteul Farmacia Tei</a>
            </div>
          </div>

          <div className="product-details">
            <h2>Detalii</h2>
            {[
              ['proprietati', 'Proprietăți', product.proprietati.join('\n')],
              ['modUtilizare', 'Mod de utilizare', product.modUtilizare.join('\n')],
              ['precautii', 'Precauții', product.precautii.join('\n')],
              ['dozaj', 'Dozaj', product.dozaj],
              ['depozitare', 'Depozitare', product.depozitare],
              ['atentie', 'Atenție', product.atentie],
            ].map(([key, title, content]) => (
              <div key={key} className="detail-section">
                <button className="section-header" onClick={() => toggle(key)}>
                  {title} <span className="expand-icon">{open[key] ? '−' : '+'}</span>
                </button>
                {open[key] && <div className="section-content" style={{ whiteSpace: 'pre-line' }}>{content}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
