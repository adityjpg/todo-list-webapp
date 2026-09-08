import { useState } from 'react'
import TaskItem from './TaskItem.jsx'

export default function TaskList({
  active,
  completed,
  listNameFor,
  selectedId,
  today,
  emptyMessage,
  onToggle,
  onOpen,
  onDelete,
  onClearCompleted,
}) {
  const [showCompleted, setShowCompleted] = useState(false)

  return (
    <div className="task-lists">
      {active.length ? (
        <ul className="task-group">
          {active.map((task) => (
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
      ) : (
        <p className="empty">{emptyMessage}</p>
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
