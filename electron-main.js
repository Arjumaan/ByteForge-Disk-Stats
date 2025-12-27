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
        icon: path.join(__dirname, 'client/public/logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false // Don't show until ready
    });

    // Remove menu bar for cleaner look
    mainWindow.setMenuBarVisibility(false);

    // Show window when ready to prevent blank screen
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Wait for server to start, then load
    let retries = 0;
    const maxRetries = 20;

    const tryLoadURL = () => {
        mainWindow.loadURL('http://localhost:3001')
            .then(() => {
                console.log('Successfully loaded app');
            })
            .catch((err) => {
                console.log(`Attempt ${retries + 1}/${maxRetries} failed, retrying...`);
                retries++;
                if (retries < maxRetries) {
                    setTimeout(tryLoadURL, 500);
                } else {
                    console.error('Failed to load app after max retries');
                    // Show error page
                    mainWindow.loadURL(`data:text/html,<html><body style="background:#1a1a1a;color:#fff;font-family:Arial;text-align:center;padding-top:100px;"><h1>Server Failed to Start</h1><p>Please restart the application</p></body></html>`);
                }
            });
    };

    // Start trying to load after 2 seconds
    setTimeout(tryLoadURL, 2000);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // DevTools disabled for production
    // mainWindow.webContents.openDevTools();
}

function startServer() {
    const serverPath = path.join(__dirname, 'server/server.js');
    console.log("Starting server from:", serverPath);

    serverProcess = fork(serverPath, [], {
        env: { ...process.env, PORT: 3001, ELECTRON_RUN: 'true' },
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => {
        console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
        console.error(`Server Error: ${data}`);
    });

    serverProcess.on('message', (msg) => {
        console.log('Server message:', msg);
    });

    serverProcess.on('error', (err) => {
        console.error('Failed to start server:', err);
    });

    serverProcess.on('exit', (code) => {
        console.log(`Server exited with code ${code}`);
    });
}

app.on('ready', () => {
    startServer();

    // Wait a bit before creating window to ensure server starts
    setTimeout(() => {
        createWindow();
    }, 1000);

    // Tray Icon
    try {
        const trayIconPath = path.join(__dirname, 'client/public/logo.png');
        tray = new Tray(trayIconPath);
        const contextMenu = Menu.buildFromTemplate([
            { label: 'Open ByteForge', click: () => { if (mainWindow) mainWindow.show(); } },
            { type: 'separator' },
            { label: 'Exit', click: () => app.quit() }
        ]);
        tray.setToolTip('ByteForge Stats Board');
        tray.setContextMenu(contextMenu);

        tray.on('double-click', () => {
            if (mainWindow) mainWindow.show();
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
