import { useEffect, useRef, useState } from 'react'
import { formatDue, isOverdue, todayStr } from '../lib/model.js'

export default function TaskDetail({
  task,
  lists,
  closing,
  onUpdate,
  onToggle,
  onDelete,
  onClose,
}) {
  const [title, setTitle] = useState(task.title)

  // Latest draft + task, so the unmount flush below never reads stale values.
  const pending = useRef({ title: task.title, task })
  pending.current = { title, task }

  // Reset the draft when a different task is opened.
  useEffect(() => {
    setTitle(task.title)
  }, [task.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Closing with Escape unmounts the panel without firing blur — flush the title here.
  useEffect(
    () => () => {
      const { title: draft, task: current } = pending.current
      const trimmed = draft.trim()
      if (trimmed && trimmed !== current.title) onUpdate(current.id, { title: trimmed })
    },
    [onUpdate],
  )

  function commitTitle() {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(task.title)
      return
    }
    if (trimmed !== task.title) onUpdate(task.id, { title: trimmed })
  }

  const today = todayStr()

  return (
    <section
      className={`detail${closing ? ' is-closing' : ''}`}
      aria-label="Task details"
      aria-hidden={closing || undefined}
    >
      <header className="detail-head">
        <label className="detail-done">
          <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} />
          <span>{task.done ? 'Completed' : 'Mark complete'}</span>
        </label>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close details">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
          </svg>
        </button>
      </header>

      <textarea
        className="detail-title"
        value={title}
        rows={2}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
        aria-label="Task title"
      />

      <div className="detail-field">
        <label className="detail-label" htmlFor="detail-due">
          Due date
        </label>
        <div className="detail-due-row">
          <input
            id="detail-due"
            type="date"
            value={task.due || ''}
            onChange={(e) => onUpdate(task.id, { due: e.target.value || null })}
          />
          {task.due && (
            <button
              type="button"
              className="text-btn"
              onClick={() => onUpdate(task.id, { due: null })}
            >
              Clear
            </button>
          )}
        </div>
        {task.due && (
          <span className={`detail-due-hint${isOverdue(task, today) ? ' is-overdue' : ''}`}>
            {formatDue(task.due, today)}
          </span>
        )}
      </div>

      <div className="detail-field">
        <label className="detail-label" htmlFor="detail-list">
          List
        </label>
        <select
          id="detail-list"
          value={task.listId || ''}
          onChange={(e) => onUpdate(task.id, { listId: e.target.value || null })}
        >
          <option value="">Inbox</option>
          {lists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name}
            </option>
          ))}
        </select>
      </div>

      <div className="detail-field detail-notes-field">
        <label className="detail-label" htmlFor="detail-notes">
          Notes
        </label>
        <textarea
          id="detail-notes"
          className="detail-notes"
          value={task.notes}
          placeholder="Add notes…"
          onChange={(e) => onUpdate(task.id, { notes: e.target.value })}
        />
      </div>

      <footer className="detail-foot">
        <button type="button" className="text-btn" onClick={() => onDelete(task.id)}>
          Delete task
        </button>
      </footer>
    </section>
  )
}
