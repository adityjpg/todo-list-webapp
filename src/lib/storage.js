import { STORE_VERSION, emptyStore, todayStr } from './model.js'

export const STORE_KEY = 'todo.v1'
export const THEME_KEY = 'todo.theme'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function cleanList(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { id, name } = raw
  if (typeof id !== 'string' || !id) return null
  if (typeof name !== 'string') return null
  return {
    id,
    name: name.slice(0, 200),
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
  }
}

function cleanTask(raw, listIds) {
  if (!raw || typeof raw !== 'object') return null
  const { id, title } = raw
  if (typeof id !== 'string' || !id) return null
  if (typeof title !== 'string') return null
  const listId = typeof raw.listId === 'string' && listIds.has(raw.listId) ? raw.listId : null
  const due = typeof raw.due === 'string' && DATE_RE.test(raw.due) ? raw.due : null
  return {
    id,
    listId,
    title: title.slice(0, 500),
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 20000) : '',
    due,
    done: raw.done === true,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    completedAt: Number.isFinite(raw.completedAt) ? raw.completedAt : null,
    deletedAt: Number.isFinite(raw.deletedAt) ? raw.deletedAt : null,
  }
}

/**
 * Coerce unknown data into a valid store, dropping anything malformed.
 * Returns null only when the top-level shape is unusable.
 */
export function normalizeStore(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.tasks)) return null

  const lists = []
  const seenLists = new Set()
  for (const item of raw.lists) {
    const list = cleanList(item)
    if (list && !seenLists.has(list.id)) {
      seenLists.add(list.id)
      lists.push(list)
    }
  }

  const tasks = []
  const seenTasks = new Set()
  for (const item of raw.tasks) {
    const task = cleanTask(item, seenLists)
    if (task && !seenTasks.has(task.id)) {
      seenTasks.add(task.id)
      tasks.push(task)
    }
  }

  return { version: STORE_VERSION, lists, tasks }
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return emptyStore()
    return normalizeStore(JSON.parse(raw)) ?? emptyStore()
  } catch {
    return emptyStore()
  }
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
    return true
  } catch {
    // Quota or a locked-down browser (private mode) — the app keeps working in memory.
    return false
  }
}

export function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function exportStore(store) {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `todo-backup-${todayStr()}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Parse an imported file's text. Returns { store } or { error }. */
export function parseImport(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return { error: "That file isn't valid JSON." }
  }
  const store = normalizeStore(parsed)
  if (!store) return { error: "That file doesn't look like a todo backup." }
  return { store }
}
