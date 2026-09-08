import { useEffect, useRef, useState } from 'react'
import ThemeToggle from './ThemeToggle.jsx'

/** Ticks when the count grows, so a task landing in another list gets noticed. */
function NavCount({ count }) {
  const [bumped, setBumped] = useState(false)
  const prev = useRef(count)

  useEffect(() => {
    if (count > prev.current) {
      setBumped(true)
      const timer = setTimeout(() => setBumped(false), 300)
      prev.current = count
      return () => clearTimeout(timer)
    }
    prev.current = count
    return undefined
  }, [count])

  return <span className={`nav-count${bumped ? ' is-bumped' : ''}`}>{count}</span>
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.5 13.5h4l1.2 2.2h6.6l1.2-2.2h4M3.5 13.5 6 5.2h12l2.5 8.3v4.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </svg>
  )
}

function TodayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.8" y="5" width="16.4" height="14.2" rx="2" />
      <path d="M3.8 9.4h16.4M8.4 3.4v3.2M15.6 3.4v3.2" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5.5 7h13M9.8 7V5.4a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2V7M7.2 7l.8 11.4a1.4 1.4 0 0 0 1.4 1.3h5.2a1.4 1.4 0 0 0 1.4-1.3L17.8 7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.6 7h.01M4.6 12h.01M4.6 17h.01" />
    </svg>
  )
}

function NavItem({ icon, label, count, active, onClick, children }) {
  return (
    <div className={`nav-row${active ? ' is-active' : ''}`}>
      <button type="button" className="nav-item" onClick={onClick} aria-current={active}>
        <span className="nav-icon">{icon}</span>
        <span className="nav-label">{label}</span>
        {count > 0 && <NavCount count={count} />}
      </button>
      {children}
    </div>
  )
}

export default function Sidebar({
  lists,
  counts,
  view,
  onSelectView,
  onAddList,
  onRenameList,
  onDeleteList,
  theme,
  onToggleTheme,
  onExport,
  onImportFile,
  importError,
  open,
  onClose,
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')
  const addInput = useRef(null)
  const editInput = useRef(null)
  const fileInput = useRef(null)

  useEffect(() => {
    if (adding) addInput.current?.focus()
  }, [adding])

  useEffect(() => {
    if (editingId) editInput.current?.select()
  }, [editingId])

  function submitNewList(event) {
    event.preventDefault()
    const created = onAddList(draft)
    setDraft('')
    if (created) {
      onSelectView({ type: 'list', id: created.id })
      // Keep the field open so several lists can be created in a row.
      addInput.current?.focus()
    } else {
      setAdding(false)
    }
  }

  function commitRename() {
    if (editingId) onRenameList(editingId, editDraft)
    setEditingId(null)
  }

  function startRename(list) {
    setEditingId(list.id)
    setEditDraft(list.name)
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (file) onImportFile(file)
    // Reset so re-importing the same file still fires a change event.
    event.target.value = ''
  }

  return (
    <aside className={`sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar-head">
        <span className="brand">Todo</span>
        <div className="sidebar-head-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            className="icon-btn sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavItem
          icon={<InboxIcon />}
          label="Inbox"
          count={counts.inbox}
          active={view.type === 'inbox'}
          onClick={() => onSelectView({ type: 'inbox' })}
        />
        <NavItem
          icon={<TodayIcon />}
          label="Today"
          count={counts.today}
          active={view.type === 'today'}
          onClick={() => onSelectView({ type: 'today' })}
        />

        <div className="nav-section">
          <span className="nav-section-title">Lists</span>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={() => setAdding(true)}
            aria-label="New list"
            title="New list"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 5.5v13M5.5 12h13" />
            </svg>
          </button>
        </div>

        {lists.map((list) =>
          editingId === list.id ? (
            <form
              key={list.id}
              className="nav-form"
              onSubmit={(e) => {
                e.preventDefault()
                commitRename()
              }}
            >
              <input
                ref={editInput}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingId(null)
                }}
                aria-label="List name"
              />
            </form>
          ) : (
            <NavItem
              key={list.id}
              icon={<ListIcon />}
              label={list.name}
              count={counts.byList[list.id] || 0}
              active={view.type === 'list' && view.id === list.id}
              onClick={() => onSelectView({ type: 'list', id: list.id })}
            >
              <div className="nav-row-actions">
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => startRename(list)}
                  aria-label={`Rename ${list.name}`}
                  title="Rename"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M4.8 19.2h3.1l8.6-8.6-3.1-3.1-8.6 8.6zM14.9 5.9l1.7-1.7a1.4 1.4 0 0 1 2 0l1.2 1.2a1.4 1.4 0 0 1 0 2l-1.7 1.7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-sm"
                  onClick={() => onDeleteList(list.id)}
                  aria-label={`Delete ${list.name}`}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5.5 7h13M9.8 7V5.4a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2V7M7.2 7l.8 11.4a1.4 1.4 0 0 0 1.4 1.3h5.2a1.4 1.4 0 0 0 1.4-1.3L17.8 7" />
                  </svg>
                </button>
              </div>
            </NavItem>
          ),
        )}

        {adding && (
          <form className="nav-form" onSubmit={submitNewList}>
            <input
              ref={addInput}
              value={draft}
              placeholder="List name"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                setAdding(false)
                setDraft('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAdding(false)
                  setDraft('')
                }
              }}
              aria-label="New list name"
            />
          </form>
        )}

        {!lists.length && !adding && (
          <p className="nav-empty">No lists yet. Use + to create one.</p>
        )}

        <div className="nav-trash">
          <NavItem
            icon={<TrashIcon />}
            label="Trash"
            count={counts.trash}
            active={view.type === 'trash'}
            onClick={() => onSelectView({ type: 'trash' })}
          />
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-foot-actions">
          <button type="button" className="text-btn" onClick={onExport}>
            Export
          </button>
          <button type="button" className="text-btn" onClick={() => fileInput.current?.click()}>
            Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            hidden
          />
        </div>
        {importError && <p className="sidebar-error">{importError}</p>}
      </div>
    </aside>
  )
}
