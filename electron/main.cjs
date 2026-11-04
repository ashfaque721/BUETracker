const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  const iconIco = path.join(__dirname, '../public/icon.ico');
  const iconPng = path.join(__dirname, '../public/icon.png');
  const appIcon = fs.existsSync(iconIco) ? iconIco : (fs.existsSync(iconPng) ? iconPng : undefined);

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'BUETracker - BUET Academic Suite',
    icon: appIcon,
    backgroundColor: '#020617',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    frame: true,
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
              message: 'BUETracker - BUET Academic Suite (Native PC)',
              detail: 'Tailored for Bangladesh University of Engineering and Technology (BUET) students.\n\nModules:\n• Module A: Official Period Routine Designer & High-Res Exporter\n• Module B: Course & Semester Management with BIIS Parser\n• Module C: BUET Ordinance Continuous Assessment Engine\n• Module D: CGPA Trajectory & Analytics Dashboard\n\nVersion 1.0.0 (Native Windows Application)'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const distIndexPath = path.join(__dirname, '../dist/index.html');

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
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
