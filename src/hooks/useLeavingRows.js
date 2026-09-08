import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion.js'

/**
 * Keeps rows that just left `items` mounted for `ms` so they can animate out, and
 * returns the list to render with those rows spliced back at the position they held.
 *
 * The store is updated immediately and stays the source of truth — this only holds a
 * copy of the departed row long enough to play the exit, so a reload mid-animation
 * can never lose the write.
 */
export function useLeavingRows(items, ms = 180) {
  const reduced = useReducedMotion()
  const [leaving, setLeaving] = useState([])
  const prev = useRef(items)
  const timers = useRef(new Map())

  useEffect(() => {
    const previous = prev.current
    prev.current = items
    if (reduced) return

    const currentIds = new Set(items.map((i) => i.id))
    const gone = []
    previous.forEach((item, index) => {
      if (!currentIds.has(item.id) && !timers.current.has(item.id)) gone.push({ item, index })
    })
    if (!gone.length) return

    setLeaving((current) => [...current, ...gone])

    for (const { item } of gone) {
      const timer = setTimeout(() => {
        timers.current.delete(item.id)
        setLeaving((current) => current.filter((l) => l.item.id !== item.id))
      }, ms)
      timers.current.set(item.id, timer)
    }
  }, [items, ms, reduced])

  // A row that comes back (undo, or unchecking) must not linger as a ghost.
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id))
    for (const [id, timer] of timers.current) {
      if (ids.has(id)) {
        clearTimeout(timer)
        timers.current.delete(id)
      }
    }
    setLeaving((current) => {
      const next = current.filter((l) => !ids.has(l.item.id))
      return next.length === current.length ? current : next
    })
  }, [items])

  useEffect(() => {
    const running = timers.current
    return () => {
      for (const timer of running.values()) clearTimeout(timer)
      running.clear()
    }
  }, [])

  if (!leaving.length) return items

  // Splice each departing row back where it was, so it fades out in place.
  const merged = [...items]
  for (const { item, index } of [...leaving].sort((a, b) => a.index - b.index)) {
    merged.splice(Math.min(index, merged.length), 0, item)
  }
  return merged
}

/** Ids currently animating out — TaskList uses this to add the `is-leaving` class. */
export function leavingIds(rendered, items) {
  const live = new Set(items.map((i) => i.id))
  return new Set(rendered.filter((r) => !live.has(r.id)).map((r) => r.id))
}
