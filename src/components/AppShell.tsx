import { Link, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Choose
        </Link>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
