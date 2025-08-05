const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createWindow();

  // обработка по кнопке
  ipcMain.on('check-for-updates', () => {
      autoUpdater.checkForUpdates().then(result => {
      const currentVersion = app.getVersion();
      const latestVersion = result?.updateInfo?.version;

      if (latestVersion && latestVersion !== currentVersion) {
        const sizeMB = (result.updateInfo.files?.[0]?.size || 0) / 1024 / 1024;
        mainWindow.webContents.send('update-info', {
          version: latestVersion,
          size: sizeMB.toFixed(2)
        });
      } else {
        // ⚠️ Нет обновлений
        mainWindow.webContents.send('update-info', {
          version: null
        });
      }
    }).catch(err => {
      mainWindow.webContents.send('update-error', err.message);
    });


    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox({
        type: "question",
        buttons: ["Перезапустить", "Позже"],
        defaultId: 0,
        message: "Обновление загружено. Перезапустить сейчас?"
      }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
    });
  });
});
