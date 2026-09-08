import { formatWhen } from '../lib/model.js'

export default function TrashView({ tasks, listNameFor, today, onRestore, onPurge, onEmpty }) {
  if (!tasks.length) {
    return <p className="empty">Trash is empty. Deleted tasks land here first.</p>
  }

  return (
    <div className="task-lists">
      <div className="trash-bar">
        <p className="trash-note">
          Deleted tasks stay here until you remove them. Restore puts a task back in its list.
        </p>
        <button type="button" className="text-btn" onClick={onEmpty}>
          Empty trash
        </button>
      </div>

      <ul className="task-group">
        {tasks.map((task) => {
          const when = formatWhen(task.deletedAt, today)
          // "Deleted today" reads naturally; a date needs its capital and an "on".
          const deleted = when === 'Today' || when === 'Yesterday' ? when.toLowerCase() : `on ${when}`
          const listName = listNameFor(task)

          return (
            <li key={task.id} className="task is-trashed">
              <div className="task-body task-body-static">
                <span className="task-title">{task.title}</span>
                <span className="task-meta">
                  <span>Deleted {deleted}</span>
                  {listName && <span className="task-list">{listName}</span>}
                </span>
              </div>
              <div className="trash-actions">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => onRestore(task.id)}
                  aria-label={`Restore “${task.title}”`}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => onPurge(task.id)}
                  aria-label={`Delete “${task.title}” for good`}
                >
                  Delete forever
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
