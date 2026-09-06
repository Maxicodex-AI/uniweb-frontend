'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import BottomTabs from './BottomTabs'
import Link from 'next/link'

const publicPages = ['/', '/login', '/register']
// Pages that handle their own full-screen layout
const fullscreenPages = ['/chat', '/live/video']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const isPublic = publicPages.includes(pathname)
  const isFullscreen = fullscreenPages.some(p => pathname === p || pathname.startsWith(p))

  if (isPublic) {
    return (
      <div>
        <nav className="navbar">
          <Link href="/" className="navbar-brand">🎓 UniWeb</Link>
          <div className="navbar-links">
            <Link href="/login">Login</Link>
            <Link href="/register">
              <button className="btn-primary" style={{ padding: '7px 16px' }}>
                Register
              </button>
            </Link>
          </div>
        </nav>
        {children}
      </div>
    )
  }

  if (isFullscreen) {
    // Full screen pages — no sidebar, no topbar, no bottom tabs
    return (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        {children}
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main-content">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main>
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}