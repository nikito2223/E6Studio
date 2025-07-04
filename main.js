const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("index.html");

  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(() => {
  createWindow();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Доступно обновление",
      message: "Новая версия доступна. Скачивается...",
      buttons: []
    });
  });

  autoUpdater.on("update-downloaded", () => {
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

