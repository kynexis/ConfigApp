

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const commentJson = require('comment-json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
    }
  });

  // Path to config file (relative to .exe or project root)
  const configRelativePath = path.join('..', 'Kynexis-SoftcoreRedux', 'config', 'config.json5');
  const configAbsolutePath = process.env.NODE_ENV === 'development'
    ? path.resolve(__dirname, configRelativePath)
    : path.resolve(process.resourcesPath, configRelativePath); // adjust as needed for packaging

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'config-app/dist/index.html'));
  }

  // IPC: Open config file dialog and read file

  ipcMain.handle('open-config-dialog', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Open Config File',
      filters: [
        { name: 'JSON5 Config', extensions: ['json5', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    if (canceled || !filePaths[0]) return { canceled: true };
    try {
      const data = fs.readFileSync(filePaths[0], 'utf8');
      const parsed = commentJson.parse(data, undefined, true);
      return { canceled: false, filePath: filePaths[0], data: parsed };
    } catch (err) {
      return { canceled: false, filePath: filePaths[0], error: err.message };
    }
  });

  // IPC: Save config file

  ipcMain.handle('save-config-file', async (event, { filePath, data }) => {
    try {
      const stringified = commentJson.stringify(data, null, 2);
      fs.writeFileSync(filePath, stringified, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // IPC: Patch config value at path (preserve comments)
  ipcMain.handle('patch-config-value', async (event, { filePath, path: pathArr, value }) => {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = commentJson.parse(raw, undefined, true);
      let obj = parsed;
      for (let i = 0; i < pathArr.length - 1; ++i) {
        if (obj[pathArr[i]] === undefined) {
          return { success: false, error: 'Invalid path' };
        }
        obj = obj[pathArr[i]];
      }
      obj[pathArr[pathArr.length - 1]] = value;
      const stringified = commentJson.stringify(parsed, null, 2);
      fs.writeFileSync(filePath, stringified, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // IPC: Auto-load config by fixed path (for production)
  ipcMain.handle('auto-load-config', async () => {
    try {
      const data = fs.readFileSync(configAbsolutePath, 'utf8');
      const parsed = commentJson.parse(data, undefined, true);
      return { success: true, filePath: configAbsolutePath, data: parsed };
    } catch (err) {
      return { success: false, error: err.message, filePath: configAbsolutePath };
    }
  });
}



app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});