import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Keeps the last value around for `ms` after it clears, so a component can play an
 * exit animation before unmounting.
 *
 * The latch is derived during render, not in an effect. An effect runs after the
 * commit, which means React would paint one frame with the value already gone — the
 * component unmounts and immediately remounts, restarting its animation and flickering.
 */
export function usePresence(value, ms = 240) {
  const reduced = useReducedMotion()
  const [latched, setLatched] = useState(value)

  // Opening is instant: adjust state during render rather than a frame later.
  if (value && value !== latched) setLatched(value)

  useEffect(() => {
    if (value) return undefined
    const timer = setTimeout(() => setLatched(null), ms)
    return () => clearTimeout(timer)
  }, [value, ms])

  // Nothing to wait for when the viewer asked for less motion.
  if (reduced) return value
  return value || latched
}
