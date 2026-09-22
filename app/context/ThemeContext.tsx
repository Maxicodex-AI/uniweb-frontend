'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleDark: () => void
  bg: string
  bgSecondary: string
  bgCard: string
  text: string
  textSecondary: string
  border: string
  inputBg: string
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleDark: () => {},
  bg: '#f8fafc',
  bgSecondary: '#f3f4f6',
  bgCard: 'white',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  inputBg: 'white',
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  // Apply the saved theme as soon as the component mounts, and set
  // data-theme on <html> so the CSS in globals.css actually activates.
  useEffect(() => {
    const saved = localStorage.getItem('uniweb-theme')
    const shouldBeDark = saved === 'dark'
    setIsDark(shouldBeDark)
    document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light')
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('uniweb-theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const light = {
    bg: '#f8fafc',
    bgSecondary: '#f3f4f6',
    bgCard: 'white',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    inputBg: 'white',
  }

  const dark = {
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgCard: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    inputBg: '#0f172a',
  }

  const theme = isDark ? dark : light

    return (
    <ThemeContext.Provider value={{ isDark, toggleDark, ...theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)