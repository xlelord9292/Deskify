const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const DataStore = require('./modules/datastore');
const fs = require('fs');

let mainWindow;
let store; // initialized after app ready to access userData path

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  const userData = app.getPath('userData');
  store = new DataStore({ filename: 'data.json', baseDir: userData });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for CRUD
ipcMain.handle('items:list', () => store.getAll());
ipcMain.handle('items:create', (e, payload) => store.create(payload));
ipcMain.handle('items:update', (e, id, updates) => store.update(id, updates));
ipcMain.handle('items:delete', (e, id) => store.delete(id));

// Export items to chosen path
ipcMain.handle('items:export', async () => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export Items',
    defaultPath: 'deskify-items.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return { canceled: true };
  const data = store.getAll();
  fs.writeFileSync(filePath, JSON.stringify({ exportedAt: new Date().toISOString(), items: data }, null, 2));
  return { canceled: false, filePath };
});

// Import items from user-chosen json file (merge)
ipcMain.handle('items:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import Items',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePaths?.length) return { canceled: true };
  const raw = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8'));
  if (!Array.isArray(raw.items)) throw new Error('Invalid file');
  const existing = store.getAll();
  const map = new Map(existing.map(i => [i.id, i]));
  raw.items.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  // overwrite file with merged set
  const merged = Array.from(map.values());
  store._replaceAll(merged);
  return { canceled: false, imported: raw.items.length, total: merged.length };
});
