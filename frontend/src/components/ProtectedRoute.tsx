import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, ready } = useAuth()
  const location = useLocation()

  // Redirecting before the session check finishes would bounce signed-in users on reload.
  if (!ready) {
    return <p className="p-8 text-slate-500">Loading...</p>
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
