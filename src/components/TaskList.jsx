import { useState } from 'react'
import TaskItem from './TaskItem.jsx'
import EmptyState from './EmptyState.jsx'
import { useLeavingRows, leavingIds } from '../hooks/useLeavingRows.js'

export default function TaskList({
  active,
  completed,
  listNameFor,
  selectedId,
  today,
  empty,
  onToggle,
  onOpen,
  onDelete,
  onClearCompleted,
}) {
  const [showCompleted, setShowCompleted] = useState(false)

  // Rows that just left are kept mounted briefly so they can animate out.
  const rendered = useLeavingRows(active)
  const leaving = leavingIds(rendered, active)

  return (
    <div className="task-lists">
      {rendered.length ? (
        <ul className="task-group">
          {rendered.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              listName={listNameFor(task)}
              selected={task.id === selectedId}
              leaving={leaving.has(task.id)}
              today={today}
              onToggle={onToggle}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : (
        <EmptyState headline={empty.headline} detail={empty.detail} />
      )}

      {completed.length > 0 && (
        <section className="completed">
          <div className="completed-head">
            <button
              type="button"
              className="text-btn completed-toggle"
              onClick={() => setShowCompleted((v) => !v)}
              aria-expanded={showCompleted}
            >
              <span className={`chevron${showCompleted ? ' is-open' : ''}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M9.5 6.5l6 5.5-6 5.5" />
                </svg>
              </span>
              Completed ({completed.length})
            </button>
            {showCompleted && (
              <button
                type="button"
                className="text-btn"
                onClick={() => onClearCompleted(completed.map((t) => t.id))}
              >
                Clear
              </button>
            )}
          </div>
          {showCompleted && (
            <ul className="task-group">
              {completed.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  listName={listNameFor(task)}
                  selected={task.id === selectedId}
                  today={today}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
