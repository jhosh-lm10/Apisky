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
    mainWindow.loadFile(path.join(app.getAppPath(), 'frontend', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  let backendPath;

  if (isDev) {
    // En desarrollo, la ruta es relativa a la carpeta 'electron'
    backendPath = path.join(__dirname, '..', 'Backend');
  } else {
    // En producción, el backend está desempaquetado en 'app.asar.unpacked'
    backendPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'Backend');
  }

  const backendEntry = path.join(backendPath, 'index.js');

  console.log(`Ruta del backend: ${backendPath}`);
  console.log(`Punto de entrada del backend: ${backendEntry}`);

  if (!fs.existsSync(backendEntry)) {
    dialog.showErrorBox(
      'Error Crítico: No se encuentra el Backend',
      `No se pudo encontrar el archivo de inicio del backend en: ${backendEntry}`
    );
    app.quit();
    return;
  }

  // Directorio de datos escribible para uploads y sesión de WhatsApp
  const userDataPath = app.getPath('userData');
  const dataDir = path.join(userDataPath, 'apisky-data');
  try { fs.mkdirSync(dataDir, { recursive: true }); } catch {} // No need to escape this, it's a valid JS string literal
  const logFile = path.join(dataDir, 'backend.log');
  let logStream;
  try { logStream = fs.createWriteStream(logFile, { flags: 'a' }); } catch {} // No need to escape this, it's a valid JS string literal
  const writeLog = (msg) => {
    try { if (logStream) logStream.write(String(msg)); } catch {} // No need to escape this, it's a valid JS string literal
  };
  writeLog(`
===== Inicio backend: ${new Date().toISOString()} =====
`);

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
      writeLog(`
[INPROC] Cargando backend en el proceso principal...
`);
      process.env.APISKY_DATA_DIR = dataDir;
      process.env.NODE_ENV = isDev ? 'development' : 'production';
      // Cargar backend directamente
      require(backendEntry);
      writeLog(`[INPROC] Backend cargado en-proceso.
`);
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
    writeLog(`
===== Backend cerrado con código ${code} =====
`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
    writeLog(`[SPAWN_ERR] ${error?.stack || error}`);
    dialog.showMessageBox({ title: 'Debug', message: `Spawn Error: ${error?.stack || error}` });
    // Fallback SIEMPRE con Node del sistema si hay error
    try {
      writeLog(`
[SPAWN_INFO] Intentando fallback con 'node' del sistema...
`);
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
        writeLog(`
===== Backend(FB) cerrado con código ${code} =====
`);
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
  if (backendProcess && !backendProcess.killed) {
    console.log('Enviando señal de cierre al backend...');
    // Enviar SIGINT para un cierre ordenado (compatible con el handler en index.js)
    backendProcess.kill('SIGINT'); 
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

