'use client'

import { useEffect, useState } from 'react'

const COOLDOWN_MS = 10 * 1000

export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const last = localStorage.getItem('splash_last_shown')
    const now = Date.now()

    if (!last || now - Number(last) > COOLDOWN_MS) {
      localStorage.setItem('splash_last_shown', String(now))
      setVisible(true)

      const fadeTimer = setTimeout(() => setFading(true), 600)
      const hideTimer = setTimeout(() => setVisible(false), 1000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#7a110d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fading ? 0 : 1,
        transition: fading ? 'opacity 0.7s ease' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'splash-spin 0.6s ease-out forwards',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_transparente.png"
          alt="Innamoratti"
          style={{ width: '260px', height: 'auto' }}
        />
      </div>
    </div>
  )
}
