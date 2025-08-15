const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  list: () => ipcRenderer.invoke('items:list'),
  create: (item) => ipcRenderer.invoke('items:create', item),
  update: (id, updates) => ipcRenderer.invoke('items:update', id, updates),
  delete: (id) => ipcRenderer.invoke('items:delete', id),
  export: () => ipcRenderer.invoke('items:export'),
  import: () => ipcRenderer.invoke('items:import')
});
