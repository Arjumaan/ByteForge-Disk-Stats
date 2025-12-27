const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let tray;
let serverProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "ByteForge Stats Board",
        icon: path.join(__dirname, 'client/public/logo.png'), // Ensure icon exists
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Remove menu bar for cleaner look
    mainWindow.setMenuBarVisibility(false);

    // Load the local server
    // We wait a bit for server to start, or poll
    setTimeout(() => {
        mainWindow.loadURL('http://localhost:3001');
    }, 2000);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startServer() {
    const serverPath = path.join(__dirname, 'server/server.js');
    console.log("Starting server from:", serverPath);

    serverProcess = fork(serverPath, [], {
        env: { ...process.env, PORT: 3001, ELECTRON_RUN: 'true' }
    });

    serverProcess.on('message', (msg) => {
        console.log('Server message:', msg);
    });
}

app.on('ready', () => {
    startServer();
    createWindow();

    // Tray Icon
    try {
        tray = new Tray(path.join(__dirname, 'client/public/logo.png'));
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open Byteforge', click: () => mainWindow.show() },
            { type: 'separator' },
            { label: 'Exit', click: () => app.quit() }
        ]);
        tray.setToolTip('ByteForge Stats Board');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            mainWindow.show();
        });
    } catch (e) {
        console.log("Tray icon error (optional):", e.message);
    }
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
