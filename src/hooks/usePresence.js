import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Keeps the last value around for `ms` after it clears, so a component can play an
 * exit animation before unmounting.
 *
 * Opening is synchronous — a live value is returned straight through, never latched
 * via an effect, which would cost a frame. Only the closing path waits on a timer,
 * and under reduced motion it doesn't wait at all.
 */
export function usePresence(value, ms = 200) {
  const reduced = useReducedMotion()
  const [closing, setClosing] = useState(null)
  const last = useRef(value)
  if (value) last.current = value

  useEffect(() => {
    if (value || reduced || !last.current) {
      setClosing(null)
      return undefined
    }
    setClosing(last.current)
    const timer = setTimeout(() => setClosing(null), ms)
    return () => clearTimeout(timer)
  }, [value, ms, reduced])

  return value || closing
}
