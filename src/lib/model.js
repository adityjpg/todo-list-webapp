export const STORE_VERSION = 1

let counter = 0

export function newId(prefix) {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

export function emptyStore() {
  return { version: STORE_VERSION, lists: [], tasks: [] }
}

export function makeList(name) {
  return { id: newId('l'), name: name.trim(), createdAt: Date.now() }
}

export function makeTask(title, listId = null) {
  return {
    id: newId('t'),
    listId: listId ?? null,
    title: title.trim(),
    notes: '',
    due: null,
    done: false,
    createdAt: Date.now(),
    completedAt: null,
    deletedAt: null,
  }
}

/** A task in the trash — soft-deleted, hidden from every other view. */
export function isTrashed(task) {
  return task.deletedAt !== null && task.deletedAt !== undefined
}

/** Local calendar day as YYYY-MM-DD — avoids the UTC shift of toISOString(). */
export function todayStr(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function isOverdue(task, today = todayStr()) {
  return !!task.due && !task.done && task.due < today
}

export function isDueToday(task, today = todayStr()) {
  return !!task.due && !task.done && task.due === today
}

/** Short human label for a due date: Today / Tomorrow / Yesterday / Mar 4 / Mar 4, 2027 */
export function formatDue(due, today = todayStr()) {
  if (!due) return ''
  const [y, m, d] = due.split('-').map(Number)
  if (!y || !m || !d) return due
  const date = new Date(y, m - 1, d)
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const diff = Math.round((date - base) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  // Inside the coming week a weekday name reads faster than a date.
  if (diff > 1 && diff < 7) return date.toLocaleDateString(undefined, { weekday: 'long' })
  const sameYear = String(y) === today.slice(0, 4)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Short label for a timestamp, e.g. "Today", "Yesterday", "Mar 4". */
export function formatWhen(ts, today = todayStr()) {
  if (!Number.isFinite(ts)) return ''
  return formatDue(todayStr(new Date(ts)), today)
}

/**
 * A date label for use mid-sentence: relative words lowercase ("today"), real
 * dates and weekdays keep their capital ("on Sep 5", "on Thursday").
 */
export function inlineWhen(label) {
  if (!label) return ''
  return /^(Today|Tomorrow|Yesterday)$/.test(label) ? label.toLowerCase() : `on ${label}`
}

/** Active tasks first by due date (undated last), then oldest first. */
export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1
    if (a.due && !b.due) return -1
    if (!a.due && b.due) return 1
    return a.createdAt - b.createdAt
  })
}
