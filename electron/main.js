const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Check if we're in development mode
const isDev = !app.isPackaged;

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'Apisky - WhatsApp Mass Messaging',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  let backendPath = path.join(__dirname, '../Backend');
  let backendEntry = path.join(backendPath, 'index.js');
  // Si está empaquetado, intentar usar rutas relativas a resources
  if (!isDev) {
    const resourcesPath = process.resourcesPath; // .../win-unpacked/resources
    const unpackedBackend = path.join(resourcesPath, 'app.asar.unpacked', 'Backend');
    const unpackedEntry = path.join(unpackedBackend, 'index.js');
    if (fs.existsSync(unpackedEntry)) {
      backendPath = unpackedBackend;
      backendEntry = unpackedEntry;
    } else if (backendEntry.includes('app.asar')) {
      const replaced = backendEntry.replace('app.asar', 'app.asar.unpacked');
      if (fs.existsSync(replaced)) {
        backendEntry = replaced;
        backendPath = path.dirname(replaced);
      }
    }
  }

  // Directorio de datos escribible para uploads y sesión de WhatsApp
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'apisky-data');
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
  const logFile = path.join(dataDir, 'backend.log');
  let logStream;
  try { logStream = fs.createWriteStream(logFile, { flags: 'a' }); } catch {}
  const writeLog = (msg) => {
    try { if (logStream) logStream.write(String(msg)); } catch {}
  };
  writeLog(`\n===== Inicio backend: ${new Date().toISOString()} =====\n`);

  const spawnElectronNode = () => spawn(process.execPath, [backendEntry], {
    cwd: backendPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: isDev ? 'development' : 'production',
      APISKY_DATA_DIR: dataDir
    },
    windowsHide: true
  });

  const spawnSystemNode = () => spawn('node', [backendEntry], {
    cwd: backendPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      APISKY_DATA_DIR: dataDir
    },
    windowsHide: true,
    shell: true
  });

  const runInProcess = () => {
    try {
      writeLog(`\n[INPROC] Cargando backend en el proceso principal...\n`);
      process.env.APISKY_DATA_DIR = dataDir;
      process.env.NODE_ENV = isDev ? 'development' : 'production';
      // Cargar backend directamente
      require(backendEntry);
      writeLog(`[INPROC] Backend cargado en-proceso.\n`);
      return true;
    } catch (e) {
      writeLog(`[INPROC_ERR] ${e?.stack || e}`);
      return false;
    }
  };

  backendProcess = spawnElectronNode();

  backendProcess.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`Backend: ${text}`);
    writeLog(text);
  });

  backendProcess.stderr.on('data', (data) => {
    const text = data.toString();
    console.error(`Backend Error: ${text}`);
    writeLog(`[ERR] ${text}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    writeLog(`\n===== Backend cerrado con código ${code} =====\n`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
    writeLog(`[SPAWN_ERR] ${error?.stack || error}`);
    // Fallback SIEMPRE con Node del sistema si hay error
    try {
      writeLog(`\n[SPAWN_INFO] Intentando fallback con 'node' del sistema...\n`);
      const fb = spawnSystemNode();
      backendProcess = fb;
      fb.stdout.on('data', (data) => {
        const text = data.toString();
        console.log(`Backend(FB): ${text}`);
        writeLog(text);
      });
      fb.stderr.on('data', (data) => {
        const text = data.toString();
        console.error(`Backend(FB) Error: ${text}`);
        writeLog(`[ERR] ${text}`);
      });
      fb.on('close', (code) => {
        console.log(`Backend(FB) process exited with code ${code}`);
        writeLog(`\n===== Backend(FB) cerrado con código ${code} =====\n`);
        // Si también falla el proceso fallback, intentar en-proceso
        if (code !== 0) {
          runInProcess();
        }
      });
    } catch (e) {
      writeLog(`[SPAWN_FB_ERR] ${e?.stack || e}`);
      // Como último recurso, in-process
      runInProcess();
    }
  });
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

app.whenReady().then(() => {
  startBackend();
  
  // Wait a bit for backend to start
  setTimeout(() => {
    createWindow();
  }, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// IPC handlers for communication between main and renderer processes
ipcMain.handle('get-backend-status', async () => {
  return { status: backendProcess ? 'running' : 'stopped' };
});

ipcMain.handle('restart-backend', async () => {
  stopBackend();
  startBackend();
  return { success: true };
});

// Handle file dialogs
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});

