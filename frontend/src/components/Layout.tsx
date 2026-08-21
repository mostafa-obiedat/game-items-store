import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { username, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/products" className="text-lg font-bold">
            Game Items Store
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {username && <span className="hidden text-slate-500 sm:inline">{username}</span>}
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
