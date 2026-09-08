import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function read() {
  try {
    return window.matchMedia(QUERY).matches
  } catch {
    return false
  }
}

/** True when the viewer asked for less motion — exit animations skip their delay. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(read)

  useEffect(() => {
    let mq
    try {
      mq = window.matchMedia(QUERY)
    } catch {
      return undefined
    }
    const onChange = (e) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
