import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <div className="container">
        <header className="home-header">
          <h1>Scanner Produse Farmacia Tei</h1>
          <p className="home-description">
            Scanează codurile QR de pe produse pentru a vedea instant detaliile.
          </p>
        </header>

        <div className="home-content">
          <div className="feature-card">
            <h2>Informații rapide despre produse</h2>
            <p>Apasă mai jos pentru a începe scanare.</p>
          </div>

          <div className="home-actions">
            <Link to="/scan" className="scan-button">
              <span className="scan-icon">📱</span>
              Scanează produsul
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
