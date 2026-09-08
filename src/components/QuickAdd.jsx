import { useState } from 'react'

export default function QuickAdd({ inputRef, placeholder, onAdd }) {
  const [value, setValue] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!value.trim()) return
    onAdd(value)
    setValue('')
    // Keep focus so tasks can be typed in a burst.
    inputRef.current?.focus()
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <span className="quick-add-plus" aria-hidden="true">
        +
      </span>
      <input
        ref={inputRef}
        className="quick-add-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setValue('')
            e.currentTarget.blur()
          }
        }}
        aria-label="Add a task"
      />
    </form>
  )
}
