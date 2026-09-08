import { useCallback, useEffect, useRef, useState } from 'react'
import { makeList, makeTask } from '../lib/model.js'
import { loadStore, saveStore } from '../lib/storage.js'

/**
 * Owns the entire store and every mutation. Persists to localStorage on change,
 * and keeps a single-level undo snapshot for destructive actions.
 */
export function useStore() {
  const [store, setStore] = useState(loadStore)
  const [undo, setUndo] = useState(null) // { message, store }
  const undoTimer = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    // Skip the write triggered by the initial load.
    if (first.current) {
      first.current = false
      return
    }
    saveStore(store)
  }, [store])

  useEffect(() => () => clearTimeout(undoTimer.current), [])

  const offerUndo = useCallback((message, snapshot) => {
    clearTimeout(undoTimer.current)
    setUndo({ message, store: snapshot })
    undoTimer.current = setTimeout(() => setUndo(null), 6000)
  }, [])

  const dismissUndo = useCallback(() => {
    clearTimeout(undoTimer.current)
    setUndo(null)
  }, [])

  const applyUndo = useCallback(() => {
    setUndo((current) => {
      if (current) setStore(current.store)
      return null
    })
    clearTimeout(undoTimer.current)
  }, [])

  const addTask = useCallback((title, listId) => {
    const trimmed = title.trim()
    if (!trimmed) return null
    const task = makeTask(trimmed, listId)
    setStore((s) => ({ ...s, tasks: [...s.tasks, task] }))
    return task
  }, [])

  const updateTask = useCallback((id, patch) => {
    setStore((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }, [])

  const toggleTask = useCallback((id) => {
    setStore((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: t.done ? null : Date.now() } : t,
      ),
    }))
  }, [])

  /** Deleting is a move to the trash, never a destructive write. */
  const trashTask = useCallback(
    (id) => {
      setStore((s) => {
        const task = s.tasks.find((t) => t.id === id)
        if (!task) return s
        offerUndo(`Moved “${task.title}” to Trash`, s)
        return {
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, deletedAt: Date.now() } : t)),
        }
      })
    },
    [offerUndo],
  )

  const restoreTask = useCallback((id) => {
    setStore((s) => {
      const listIds = new Set(s.lists.map((l) => l.id))
      return {
        ...s,
        tasks: s.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                deletedAt: null,
                // Its list may have been deleted in the meantime — land it in the Inbox.
                listId: t.listId && listIds.has(t.listId) ? t.listId : null,
              }
            : t,
        ),
      }
    })
  }, [])

  const purgeTask = useCallback(
    (id) => {
      setStore((s) => {
        const task = s.tasks.find((t) => t.id === id)
        if (!task) return s
        offerUndo(`Deleted “${task.title}” for good`, s)
        return { ...s, tasks: s.tasks.filter((t) => t.id !== id) }
      })
    },
    [offerUndo],
  )

  const emptyTrash = useCallback(() => {
    setStore((s) => {
      const count = s.tasks.filter((t) => t.deletedAt).length
      if (!count) return s
      offerUndo(`Deleted ${count} task${count === 1 ? '' : 's'} for good`, s)
      return { ...s, tasks: s.tasks.filter((t) => !t.deletedAt) }
    })
  }, [offerUndo])

  const clearCompleted = useCallback(
    (taskIds) => {
      const ids = new Set(taskIds)
      if (!ids.size) return
      setStore((s) => {
        offerUndo(`Moved ${ids.size} completed task${ids.size === 1 ? '' : 's'} to Trash`, s)
        const now = Date.now()
        return {
          ...s,
          tasks: s.tasks.map((t) => (ids.has(t.id) ? { ...t, deletedAt: now } : t)),
        }
      })
    },
    [offerUndo],
  )

  const addList = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const list = makeList(trimmed)
    setStore((s) => ({ ...s, lists: [...s.lists, list] }))
    return list
  }, [])

  const renameList = useCallback((id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setStore((s) => ({
      ...s,
      lists: s.lists.map((l) => (l.id === id ? { ...l, name: trimmed } : l)),
    }))
  }, [])

  /** Deleting a list keeps its tasks — they fall back to the Inbox. */
  const deleteList = useCallback(
    (id) => {
      setStore((s) => {
        const list = s.lists.find((l) => l.id === id)
        if (!list) return s
        offerUndo(`Deleted “${list.name}” — its tasks moved to Inbox`, s)
        return {
          ...s,
          lists: s.lists.filter((l) => l.id !== id),
          tasks: s.tasks.map((t) => (t.listId === id ? { ...t, listId: null } : t)),
        }
      })
    },
    [offerUndo],
  )

  const replaceStore = useCallback(
    (next, message) => {
      setStore((s) => {
        offerUndo(message, s)
        return next
      })
    },
    [offerUndo],
  )

  return {
    store,
    undo,
    applyUndo,
    dismissUndo,
    addTask,
    updateTask,
    toggleTask,
    trashTask,
    restoreTask,
    purgeTask,
    emptyTrash,
    clearCompleted,
    addList,
    renameList,
    deleteList,
    replaceStore,
  }
}
