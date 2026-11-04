const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'BUETracker - BUET Academic Suite',
    icon: path.join(__dirname, '../public/icon.png'),
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    frame: true, // Native titlebar with controls
    autoHideMenuBar: false
  });

  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Routine (Ctrl+E)',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('trigger-export-routine')
        },
        {
          label: 'Print Routine (Ctrl+P)',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.send('trigger-print-routine')
        },
        {
          label: 'Save / Sync Database (Ctrl+S)',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('trigger-save-db')
        },
        { type: 'separator' },
        {
          label: 'Backup Data as JSON...',
          click: () => mainWindow?.webContents.send('trigger-backup-json')
        },
        {
          label: 'Restore Data from JSON...',
          click: () => mainWindow?.webContents.send('trigger-restore-json')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About BUETracker',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About BUETracker',
              message: 'BUETracker - BUET Academic Suite',
              detail: 'Tailored for Bangladesh University of Engineering and Technology (BUET) students.\n\nFeatures:\n• BUET Timetable Designer & High-Res Exporter\n• BUET Ordinance Continuous Assessment Engine (Best n of n+1 CTs, Attendance Slabs, Term Final Targets)\n• Course & Historical Term Management with BIIS Parser\n• Academic Analytics & CGPA Projection Engine\n\nVersion 1.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode if requested
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('save-file-dialog', async (event, { defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  });
  return result;
});

ipcMain.handle('save-file-content', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

