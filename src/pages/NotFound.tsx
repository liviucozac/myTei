import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container not-found">
      <h2>Page not found</h2>
      <Link className="home-button" to="/">Go Home</Link>
    </div>
  )
}