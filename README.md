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

**Tasks**

Type in the box at the top and press Enter — the field keeps focus, so you can add several
in a row. Click a task to open the detail panel for notes, a due date, and which list it
belongs to. Overdue dates are the one bit of color in the app.

Completed tasks drop into a collapsed **Completed** group at the bottom of the view.

**Undo**

Deleting a task or a list, clearing completed, and importing a backup all show an undo
toast for six seconds instead of a confirmation dialog.

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
  tasks: [{ id, listId, title, notes, due, done, createdAt, completedAt }]
}
```

`listId: null` means the Inbox — there's no Inbox record, which is what lets a deleted
list hand its tasks back safely. `due` is a plain `YYYY-MM-DD` local date, so there's no
timezone arithmetic anywhere.

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
  components/          Sidebar, QuickAdd, TaskList, TaskItem, TaskDetail, Toast
```

Theming is CSS custom properties on `:root`, overridden under `[data-theme="dark"]`. A
small inline script in `index.html` stamps the theme onto `<html>` before the bundle loads,
so dark mode never flashes white on reload.
