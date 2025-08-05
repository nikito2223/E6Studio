const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// Загружаем package.json
const packagePath = path.join(__dirname, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));


contextBridge.exposeInMainWorld('electronAPI', {
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateInfo: (callback) => ipcRenderer.on('update-info', (_, info) => callback(info)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_, error) => callback(error)),
});


contextBridge.exposeInMainWorld('appInfo', {
  get: () => ({
    name: packageData.name,
    version: packageData.version,
    description: packageData.description,
    author: packageData.author,
    license: packageData.license,
  }),
});
