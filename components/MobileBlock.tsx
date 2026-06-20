'use client'

import { useEffect, useState } from 'react'

export default function MobileBlock({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const narrowScreen = window.innerWidth < 1024
      const mobileAgent = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
      setIsMobile(narrowScreen || mobileAgent)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '1.5rem' }}>🖥️</div>
        <h1 style={{ color: '#00bfff', fontSize: '24px', fontWeight: '700', marginBottom: '1rem' }}>
          Desktop Only
        </h1>
        <p style={{ color: '#888', fontSize: '15px', lineHeight: '1.6', maxWidth: '320px' }}>
          Vibe Arena is built for desktop browsers. Open this on your laptop or PC to compete.
        </p>
      </div>
    )
  }

  return <>{children}</>
}