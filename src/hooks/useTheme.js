import { useCallback, useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../lib/storage.js'

export function useTheme() {
  const [theme, setTheme] = useState(loadTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
