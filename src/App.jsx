import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QuickAdd from './components/QuickAdd.jsx'
import Sidebar from './components/Sidebar.jsx'
import TaskDetail from './components/TaskDetail.jsx'
import TaskList from './components/TaskList.jsx'
import Toast from './components/Toast.jsx'
import TrashView from './components/TrashView.jsx'
import { usePresence } from './hooks/usePresence.js'
import { useStore } from './hooks/useStore.js'
import { useTheme } from './hooks/useTheme.js'
import { formatDue, isTrashed, sortTasks, todayStr } from './lib/model.js'
import { exportStore, parseImport } from './lib/storage.js'

export default function App() {
  const {
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
  } = useStore()
  const { theme, toggleTheme } = useTheme()

  const [view, setView] = useState({ type: 'inbox' })
  const [selectedId, setSelectedId] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [importError, setImportError] = useState('')
  const quickAddRef = useRef(null)

  const today = todayStr()

  // A list can disappear via delete or import — fall back to the Inbox.
  useEffect(() => {
    if (view.type === 'list' && !store.lists.some((l) => l.id === view.id)) {
      setView({ type: 'inbox' })
    }
  }, [store.lists, view])

  const selected = useMemo(
    () => store.tasks.find((t) => t.id === selectedId && !isTrashed(t)) || null,
    [store.tasks, selectedId],
  )

  const counts = useMemo(() => {
    const byList = {}
    let inbox = 0
    let todayCount = 0
    let trash = 0
    for (const task of store.tasks) {
      if (isTrashed(task)) {
        trash += 1
        continue
      }
      if (task.done) continue
      if (task.listId) byList[task.listId] = (byList[task.listId] || 0) + 1
      else inbox += 1
      if (task.due && task.due <= today) todayCount += 1
    }
    return { byList, inbox, today: todayCount, trash }
  }, [store.tasks, today])

  const visible = useMemo(() => {
    const inView = store.tasks.filter((task) => {
      if (isTrashed(task)) return false
      if (view.type === 'inbox') return task.listId === null
      if (view.type === 'list') return task.listId === view.id
      // Today: due today or earlier. Completed items stay out of this view.
      return !!task.due && task.due <= today && !task.done
    })
    return {
      active: sortTasks(inView.filter((t) => !t.done)),
      completed: inView
        .filter((t) => t.done)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)),
    }
  }, [store.tasks, view, today])

  const trashed = useMemo(
    () =>
      store.tasks
        .filter(isTrashed)
        .sort((a, b) => b.deletedAt - a.deletedAt),
    [store.tasks],
  )

  // The panel outlives `selected` by one animation so it can slide away.
  const detailTask = usePresence(selected, 200)

  const currentList = view.type === 'list' ? store.lists.find((l) => l.id === view.id) : null
  const heading =
    view.type === 'inbox'
      ? 'Inbox'
      : view.type === 'today'
        ? 'Today'
        : view.type === 'trash'
          ? 'Trash'
          : currentList?.name || ''

  const listNameFor = useCallback(
    (task) => {
      // Only useful where tasks are gathered from everywhere.
      if (view.type !== 'today' && view.type !== 'trash') return null
      if (!task.listId) return 'Inbox'
      return store.lists.find((l) => l.id === task.listId)?.name || null
    },
    [view.type, store.lists],
  )

  function handleAdd(title) {
    // In Today, a new task has no list context — it belongs in the Inbox.
    const listId = view.type === 'list' ? view.id : null
    const task = addTask(title, listId)
    if (task && view.type === 'today') {
      // Give it today's date so it doesn't vanish from the view it was typed in.
      updateTask(task.id, { due: today })
    }
  }

  function handleSelectView(next) {
    setView(next)
    setSelectedId(null)
    setMenuOpen(false)
    setImportError('')
  }

  function handleImport(file) {
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => {
      const { store: imported, error } = parseImport(String(reader.result))
      if (error) {
        setImportError(error)
        return
      }
      setSelectedId(null)
      replaceStore(imported, `Imported ${imported.tasks.length} tasks`)
    }
    reader.onerror = () => setImportError("Couldn't read that file.")
    reader.readAsText(file)
  }

  // Global shortcuts: "/" focuses quick add, Escape closes the detail panel.
  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (event.key === '/' && !typing) {
        event.preventDefault()
        quickAddRef.current?.focus()
        return
      }
      if (event.key !== 'Escape') return

      // Escape closes the detail panel even while a field inside it has focus;
      // blurring first lets the field commit its edit.
      if (event.target.closest?.('.detail')) {
        event.target.blur()
        setSelectedId(null)
        return
      }
      // Quick add and the sidebar's inline inputs handle their own Escape.
      if (typing) return
      setSelectedId(null)
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const countLabel = view.type === 'trash' ? trashed.length : visible.active.length

  // "Finished everything" and "never had anything" are different situations, and
  // shouldn't share a sentence.
  const empty = useMemo(() => {
    const finishedSome = visible.completed.length > 0

    if (view.type === 'today') {
      const next = store.tasks
        .filter((t) => !isTrashed(t) && !t.done && t.due && t.due > today)
        .sort((a, b) => (a.due < b.due ? -1 : 1))[0]
      return {
        headline: 'Nothing due today.',
        detail: next
          ? `Next up: ${formatDue(next.due, today)}.`
          : 'Nothing scheduled later, either.',
      }
    }

    if (view.type === 'inbox') {
      return finishedSome
        ? { headline: 'Inbox is clear.', detail: 'Everything here is finished.' }
        : { headline: 'Nothing in the Inbox.', detail: 'Press / to add the first one.' }
    }

    const name = currentList?.name || 'this list'
    return finishedSome
      ? { headline: `${name} is clear.`, detail: 'Everything here is finished.' }
      : { headline: `Nothing in ${name} yet.`, detail: 'Press / to add the first one.' }
  }, [view.type, visible.completed.length, store.tasks, today, currentList])

  return (
    <div className={`app${selected ? ' has-detail' : ''}`}>
      {/* Always mounted so it can fade out as well as in. */}
      <div
        className={`scrim${menuOpen ? ' is-open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        lists={store.lists}
        counts={counts}
        view={view}
        onSelectView={handleSelectView}
        onAddList={addList}
        onRenameList={renameList}
        onDeleteList={deleteList}
        theme={theme}
        onToggleTheme={toggleTheme}
        onExport={() => exportStore(store)}
        onImportFile={handleImport}
        importError={importError}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="main">
        <header className="main-head">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
            </svg>
          </button>
          <h1 className="main-title">{heading}</h1>
          <span className="main-count">
            {countLabel} task{countLabel === 1 ? '' : 's'}
          </span>
        </header>

        <div className="view" key={view.type === 'list' ? `list-${view.id}` : view.type}>
        {view.type === 'trash' ? (
          <TrashView
            tasks={trashed}
            listNameFor={listNameFor}
            today={today}
            onRestore={restoreTask}
            onPurge={purgeTask}
            onEmpty={emptyTrash}
          />
        ) : (
          <>
            <QuickAdd
              inputRef={quickAddRef}
              placeholder={
                view.type === 'today'
                  ? 'Add a task for today'
                  : `Add a task to ${heading || 'this list'}`
              }
              onAdd={handleAdd}
            />

            <TaskList
              active={visible.active}
              completed={visible.completed}
              listNameFor={listNameFor}
              selectedId={selectedId}
              today={today}
              empty={empty}
              onToggle={toggleTask}
              onOpen={setSelectedId}
              onDelete={(id) => {
                if (id === selectedId) setSelectedId(null)
                trashTask(id)
              }}
              onClearCompleted={(ids) => {
                if (ids.includes(selectedId)) setSelectedId(null)
                clearCompleted(ids)
              }}
            />
          </>
        )}
        </div>
      </main>

      {detailTask && (
        <TaskDetail
          key={detailTask.id}
          task={detailTask}
          closing={!selected}
          lists={store.lists}
          onUpdate={updateTask}
          onToggle={toggleTask}
          onDelete={(id) => {
            setSelectedId(null)
            trashTask(id)
          }}
          onClose={() => setSelectedId(null)}
        />
      )}

      {undo && <Toast message={undo.message} onUndo={applyUndo} onDismiss={dismissUndo} />}
    </div>
  )
}
