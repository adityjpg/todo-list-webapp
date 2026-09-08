import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QuickAdd from './components/QuickAdd.jsx'
import Sidebar from './components/Sidebar.jsx'
import TaskDetail from './components/TaskDetail.jsx'
import TaskList from './components/TaskList.jsx'
import Toast from './components/Toast.jsx'
import { useStore } from './hooks/useStore.js'
import { useTheme } from './hooks/useTheme.js'
import { sortTasks, todayStr } from './lib/model.js'
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
    deleteTask,
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
    () => store.tasks.find((t) => t.id === selectedId) || null,
    [store.tasks, selectedId],
  )

  const counts = useMemo(() => {
    const byList = {}
    let inbox = 0
    let todayCount = 0
    for (const task of store.tasks) {
      if (task.done) continue
      if (task.listId) byList[task.listId] = (byList[task.listId] || 0) + 1
      else inbox += 1
      if (task.due && task.due <= today) todayCount += 1
    }
    return { byList, inbox, today: todayCount }
  }, [store.tasks, today])

  const visible = useMemo(() => {
    const inView = store.tasks.filter((task) => {
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

  const currentList = view.type === 'list' ? store.lists.find((l) => l.id === view.id) : null
  const heading = view.type === 'inbox' ? 'Inbox' : view.type === 'today' ? 'Today' : currentList?.name || ''

  const listNameFor = useCallback(
    (task) => {
      // Only useful in Today, where tasks come from everywhere.
      if (view.type !== 'today') return null
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

  const emptyMessage =
    view.type === 'today'
      ? 'Nothing due today.'
      : view.type === 'inbox'
        ? 'Inbox is clear. Add a task above.'
        : 'No tasks in this list yet.'

  return (
    <div className={`app${selected ? ' has-detail' : ''}`}>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}

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
            {visible.active.length} open
          </span>
        </header>

        <QuickAdd
          inputRef={quickAddRef}
          placeholder={
            view.type === 'today' ? 'Add a task for today' : `Add a task to ${heading || 'this list'}`
          }
          onAdd={handleAdd}
        />

        <TaskList
          active={visible.active}
          completed={visible.completed}
          listNameFor={listNameFor}
          selectedId={selectedId}
          today={today}
          emptyMessage={emptyMessage}
          onToggle={toggleTask}
          onOpen={setSelectedId}
          onDelete={(id) => {
            if (id === selectedId) setSelectedId(null)
            deleteTask(id)
          }}
          onClearCompleted={(ids) => {
            if (ids.includes(selectedId)) setSelectedId(null)
            clearCompleted(ids)
          }}
        />
      </main>

      {selected && (
        <TaskDetail
          key={selected.id}
          task={selected}
          lists={store.lists}
          onUpdate={updateTask}
          onToggle={toggleTask}
          onDelete={(id) => {
            setSelectedId(null)
            deleteTask(id)
          }}
          onClose={() => setSelectedId(null)}
        />
      )}

      {undo && <Toast message={undo.message} onUndo={applyUndo} onDismiss={dismissUndo} />}
    </div>
  )
}
