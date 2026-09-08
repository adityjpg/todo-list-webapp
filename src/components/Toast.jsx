export default function Toast({ message, onUndo, onDismiss }) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-action" onClick={onUndo}>
        Undo
      </button>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
      {/* Drains over the undo window, so the time left is visible rather than guessed. */}
      <span className="toast-timer" aria-hidden="true" />
    </div>
  )
}
