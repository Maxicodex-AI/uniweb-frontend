'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomTabs() {
  const pathname = usePathname()

  const publicPages = ['/', '/login', '/register']
  if (publicPages.includes(pathname)) return null

  const tabs = [
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/live', icon: '📡', label: 'Live' },
    { href: '/learning-hub', icon: '🎓', label: 'Hub' },
    { href: '/announcements', icon: '📢', label: 'More' },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <nav className="bottom-tabs">
      {tabs.map(tab => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`bottom-tab ${isActive(tab.href) ? 'active' : ''}`}
        >
          <span className="bottom-tab-icon">{tab.icon}</span>
          <span className="bottom-tab-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}