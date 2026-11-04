const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  onTriggerExportRoutine: (callback) => ipcRenderer.on('trigger-export-routine', () => callback()),
  onTriggerPrintRoutine: (callback) => ipcRenderer.on('trigger-print-routine', () => callback()),
  onTriggerSaveDb: (callback) => ipcRenderer.on('trigger-save-db', () => callback()),
  onTriggerBackupJson: (callback) => ipcRenderer.on('trigger-backup-json', () => callback()),
  onTriggerRestoreJson: (callback) => ipcRenderer.on('trigger-restore-json', () => callback()),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  saveFileContent: (options) => ipcRenderer.invoke('save-file-content', options),
});

