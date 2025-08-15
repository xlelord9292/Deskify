# Deskify

Cross‑platform offline desktop data manager built with Electron, focused on simplicity, local-first data, and extensibility.

## ✨ Core Features
| Area | Details |
|------|---------|
| Data | Local JSON storage (per-user app data dir) – no external DB required |
| CRUD | Create, edit, delete items (title + description, timestamps) |
| Search | Instant client-side filtering as you type |
| Import / Export | Merge-import JSON; export full dataset with metadata |
| Theming | Dark + Light toggle (persisted) |
| Packaging | electron-builder: NSIS (Win), AppImage & deb (Linux), dmg (add if needed), asar bundling |
| Security | contextIsolation, no nodeIntegration, minimal IPC surface |
| Offline | 100% functional without network |

## 🗂 Directory Layout
```
Deskify/
  build/              # Icons & build resources
  src/
    main.js           # Electron main process (windows, IPC)
    preload.js        # Safe API bridge -> window.api
    modules/
      datastore.js    # JSON file persistence + CRUD
    renderer/
      index.html      # UI shell
      styles.css      # Styling (dark/light)
      renderer.js     # Front-end logic: search, theme, import/export
  test/
    testDatastore.js  # Basic datastore test
  package.json        # Scripts + electron-builder config
  README.md
```

## 🚀 Quick Start (Development)
```powershell
git clone https://github.com/<your-org>/Deskify.git
cd Deskify
npm install
npm run dev
```
Electron window should open. Edit files under `src/renderer` to iterate UI (Hot reload requires manual refresh / restart unless you add a watcher like electronmon).

## 🔨 Build / Distribute
We use `electron-builder`.

### Prerequisites
- Node.js LTS (>=18 recommended)
- On Windows for NSIS: electron-builder bundles nsis binaries automatically (no separate install required)
- On Linux building for Windows/mac may need Wine/Mono (optional if cross-building)

### Commands
```powershell
npm run dist       # Builds platform-specific installer(s)
```
Artifacts output to `dist/`:
- Windows: `Deskify Setup x.y.z.exe` (NSIS). Supports custom installation directory & start menu/desktop shortcuts.
- Linux: `.AppImage`, `.deb`.
- (Add mac target by running build on macOS or enabling CI matrix.)

### Customizing Installer
`package.json` -> `build.nsis` keys:
- `oneClick`: false gives wizard.
- `allowToChangeInstallationDirectory`: user can pick path.
- `deleteAppDataOnUninstall`: set true if you want to purge user data.

## 💾 Data Storage
File lives at: `<userData>/data.json` (OS-dependent)
| OS | Example Path |
|----|--------------|
| Windows | `C:\Users\\<User>\AppData\Roaming\Deskify\data.json` |
| macOS | `~/Library/Application Support/Deskify/data.json` |
| Linux | `~/.config/Deskify/data.json` |

Back up or migrate by copying that file. Export feature also generates a JSON bundle with ISO timestamps.

## 🔐 Security Model
Renderer cannot directly access Node; only whitelisted methods via `preload.js`:
```js
window.api = { list, create, update, delete, export, import }
```
All file I/O stays in main process. No remote URLs loaded (CSP restricts).

## 🧪 Testing
Minimal test provided for datastore logic:
```powershell
npm test
```
Add more with a framework (e.g., vitest, jest) as complexity grows.

## 🧱 Architecture Overview
1. main -> boots BrowserWindow, wires IPC handlers
2. datastore -> synchronous JSON CRUD (small scale). For larger sets, move to better storage (SQLite, better-sqlite3, LokiJS)
3. preload -> contextIsolation bridge
4. renderer -> DOM + simple state (CACHE array). Could be migrated to React/Vue/Svelte later.

## 🔄 Import vs Export Semantics
Export: writes `{ exportedAt, items:[...] }`.
Import: merges by `id` (existing preserved; new appended). No conflict resolution UI yet.

## 🎨 Theming
Stores `theme` in `localStorage` (values: `dark|light`). Toggle cycles; applied on load.

## 🧩 Extending Ideas
- Tags / categories, full-text search indexing
- Encryption (libs: `crypto` + user passphrase; derive key with PBKDF2/Argon2)
- Auto backup rotation (copy `data.json` to `data-YYYYMMDDHHmm.json`)
- System tray + quick add window
- Sync plugin system (optional remote providers)
- Schema validation (zod) for robust IPC input guarding

## 🤝 Contributing
1. Fork & branch: `feat/<short-desc>`
2. Run `npm test` before PR
3. Use conventional commits if possible (e.g., `feat: add tagging`)
4. Open PR with summary + screenshots for UI changes

## 🛠 Troubleshooting
| Issue | Fix |
|-------|-----|
| PowerShell execution policy warning | It's your profile script; app still launches. Or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in elevated shell. |
| Blank window | Check console (Ctrl+Shift+I). Ensure no CSP violation. |
| Build fails on Windows | Delete `dist/`, re-run `npm install`, then `npm run dist`. |
| Import error "Invalid file" | File missing `items` array. Export again from Deskify or adapt format. |

## 🧪 Manual Smoke Checklist
- Add item
- Edit item
- Search filters list
- Export JSON -> open file verify structure
- Import same file (no duplicates added)
- Toggle theme persists after restart

## 📦 Release Workflow (Suggested)
1. Update version in `package.json`
2. `npm run dist`
3. Test installer locally
4. Draft GitHub Release, upload artifacts
5. Tag: `vX.Y.Z`

Automate via GitHub Actions (matrix: win, ubuntu, mac) using `electron-builder --publish always` and a GH token.

## 📜 License
MIT – see LICENSE (add file if not present yet).

---
Questions or ideas? Open an issue or start a discussion.
