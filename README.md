# Todo

A small, fast todo app: an **Inbox**, lists you create yourself, a **Today** view, and a
light/dark toggle. Deliberately quiet — offwhite and grey in light mode, black and grey in
dark. No accounts, no backend; everything lives in your browser.

## Run it

```sh
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the built app
```

The build output in `dist/` is a plain static site — drop it on any static host.

## How it works

**Views**

- **Inbox** — anything not filed into a list.
- **Today** — everything due today or overdue, across every list. A task added here is
  dated today so it doesn't disappear the moment you type it.
- **Lists** — create with `+` in the sidebar, rename or delete on hover. Deleting a list
  keeps its tasks; they fall back to the Inbox.
- **Trash** — pinned at the bottom of the sidebar, above Export / Import. Deleting a task
  moves it here rather than destroying it; **Restore** puts it back (in the Inbox, if its
  list is gone) and **Delete forever** removes it for good. Clearing completed tasks routes
  through here too, and **Empty trash** clears the lot. Nothing in the trash counts toward
  any other view.

**Tasks**

Type in the box at the top and press Enter — the field keeps focus, so you can add several
in a row. Click a task to open the detail panel for notes, a due date, and which list it
belongs to. Overdue dates are the one bit of color in the app.

Completed tasks drop into a collapsed **Completed** group at the bottom of the view.

Due dates inside the coming week show as weekday names ("Friday") rather than dates.
Overdue tasks carry a rule down their left edge as well as red text, so the state reads
without relying on color.

**Undo**

Every destructive action — trashing a task, Delete forever, emptying the trash, deleting a
list, importing a backup — shows an undo toast for six seconds instead of a confirmation
dialog. Even a permanent delete is recoverable until that toast expires.

**Motion**

Checking a task off draws the checkmark and collapses the row; new tasks fade in; the undo
toast carries a bar that drains over its six-second window, so the time left is visible
rather than guessed. All of it is `transform`/`opacity` only, and all of it is disabled
under `prefers-reduced-motion`.

On a narrow screen the sidebar slides in over 220ms and out over 200ms, with the scrim
fading alongside it in both directions. Panels open and close on one curve
(`--ease-panel`, easeOutCubic); the app's general `--ease` is too front-loaded for a
panel exit — it covers most of the distance in the first third, which the eye reads as
a snap. The task detail panel matches: it slides in from
the right on a phone, and on a wide screen its grid column opens and closes rather than
appearing at full width. `usePresence` (`src/hooks/usePresence.js`) keeps it mounted for
its exit — opening stays synchronous, only closing waits. The closed sidebar is `visibility: hidden` — set
only after the slide finishes — so a closed menu can't be reached by Tab.

Animating a row *out* is the only part that isn't plain CSS: a completed task leaves the
active list immediately, so there'd be nothing left to animate. `useLeavingRows`
(`src/hooks/useLeavingRows.js`) keeps the departed row mounted in place for 180ms while
the store updates straight away — so a reload mid-animation can never lose the write.

**Keyboard**

| Key | Action |
| --- | --- |
| `/` | Focus the add-task field |
| `Enter` | Add the task / commit a rename |
| `Esc` | Close the detail panel, the menu, or cancel an edit |

## Data

Everything is stored in `localStorage`:

- `todo.v1` — the store below
- `todo.theme` — `light` or `dark`; unset means follow the OS setting

```js
{
  version: 1,
  lists: [{ id, name, createdAt }],
  tasks: [{ id, listId, title, notes, due, done, createdAt, completedAt, deletedAt }]
}
```

`listId: null` means the Inbox — there's no Inbox record, which is what lets a deleted
list hand its tasks back safely. `deletedAt` is the trash: a timestamp means the task sits
in it, `null` means it's live — so an ordinary delete is never a destructive write. `due` is
a plain `YYYY-MM-DD` local date, so there's no timezone arithmetic anywhere.

**Export** downloads `todo-backup-YYYY-MM-DD.json`. **Import** validates the file field by
field, drops anything malformed, and replaces the store — with an undo toast holding your
previous data if you picked the wrong file. A file that isn't a valid backup shows an error
and changes nothing.

Because storage is per-browser, data doesn't follow you between browsers or devices —
export is the way to move it.

## Layout

```
src/
  App.jsx              state wiring, views, keyboard shortcuts
  styles.css           palette (CSS custom properties) + layout
  lib/model.js         ids, factories, date helpers, sorting
  lib/storage.js       load/save, validation, export/import
  hooks/useStore.js    the store and every mutation, with undo
  hooks/useTheme.js    theme state
  hooks/useLeavingRows.js   keeps departing rows mounted so they can animate out
  hooks/useReducedMotion.js live prefers-reduced-motion state
  components/          Sidebar, QuickAdd, TaskList, TaskItem, TaskDetail, TrashView,
                       EmptyState, Toast
```

Theming is CSS custom properties on `:root`, overridden under `[data-theme="dark"]`. A
small inline script in `index.html` stamps the theme onto `<html>` before the bundle loads,
so dark mode never flashes white on reload. Motion runs off the same token idea —
`--fast` / `--base` / `--slow` and two easing curves, so timings stay consistent.

Empty states are written per situation: "you finished everything" and "you never had
anything" say different things, and an empty Today names the next date something is due.
