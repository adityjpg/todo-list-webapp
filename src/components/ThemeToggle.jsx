const SunIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </svg>
)

const MoonIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4z" />
  </svg>
)

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      onClick={onToggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
    >
      {/* Both icons stay mounted and cross-fade, so a fast double-click can't strand one. */}
      <span className={`theme-icon${dark ? '' : ' is-hidden'}`}>{SunIcon}</span>
      <span className={`theme-icon${dark ? ' is-hidden' : ''}`}>{MoonIcon}</span>
    </button>
  )
}
