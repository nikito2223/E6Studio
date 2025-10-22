const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadPlugins } = require("./src/plugins/loadPlugins");
const https = require("https");
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
    author: `${packageData.author.name} <${packageData.author.email}>`,
    license: packageData.license,
  }),
});


contextBridge.exposeInMainWorld("pluginAPI", {
    getLocalPlugins: () => ipcRenderer.invoke("get-local-plugins"),
    installPlugin: (pluginInfo) => ipcRenderer.invoke("install-plugin", pluginInfo),

    // Новый API
    getPluginsEnabled: () => ipcRenderer.invoke("get-plugins-enabled"),
    setPluginEnabled: (pluginFolder, enabled) => ipcRenderer.invoke("set-plugin-enabled", { pluginFolder, enabled })
});

window.addEventListener('DOMContentLoaded', () => {
    loadPlugins(window); // плагины сразу получают доступ к DOM
});


contextBridge.exposeInMainWorld("download", {
    downloadToAppFolder: (url, filename) => {
        // Сохраняем в папку приложения рядом с preload.js / main.js
        const appDir = __dirname; 
        const dir = path.join(appDir, "downloads");

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const filePath = path.join(dir, filename);

        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => {
                file.close();
                console.log(`Файл сохранён: ${filePath}`);
            });
        });
    }
});
