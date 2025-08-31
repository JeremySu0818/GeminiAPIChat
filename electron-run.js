// main.js
const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true, // ✅ 自動隱藏 menu bar
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // ✅ 移除選單
    Menu.setApplicationMenu(null);

    // 映射到你本地 9000 port 的網頁
    mainWindow.loadURL('http://localhost:9000');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
