import { useState, useEffect } from 'react'

// Generate or retrieve persistent anonymous user ID
export function useUserId() {
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    let id = localStorage.getItem('mwbl_user_id')
    if (!id) {
      id = 'u_' + Math.random().toString(36).substring(2, 11)
      localStorage.setItem('mwbl_user_id', id)
    }
    setUserId(id)
  }, [])

  return userId
}

// Dark mode hook
export function useDarkMode() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mwbl_dark')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (saved === 'true' || (!saved && prefersDark)) {
      setDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggle = () => {
    setDark(prev => {
      const newVal = !prev
      localStorage.setItem('mwbl_dark', String(newVal))
      document.documentElement.classList.toggle('dark', newVal)
      return newVal
    })
  }

  return [dark, toggle]
}

// Check if installed as PWA
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    setIsPWA(isStandalone)
  }, [])

  return isPWA
}
