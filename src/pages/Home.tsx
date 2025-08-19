import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home-page">
      <div className="container">
        <header className="home-header">
          <h1>Pharmacy QR Scanner</h1>
          <p className="home-description">
            Scan QR codes on products to view details instantly.
          </p>
        </header>

        <div className="home-content">
          <div className="feature-card">
            <h2>Quick Product Information</h2>
            <p>Tap below to start scanning or use image upload on desktop.</p>
          </div>

          <div className="home-actions">
            <Link to="/scan" className="scan-button">
              <span className="scan-icon">📱</span>
              Scan Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
