const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const { loadPlugins } = require("./src/plugins/loadPlugins");

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


contextBridge.exposeInMainWorld("pluginAPI", {
    getLocalPlugins: () => ipcRenderer.invoke("get-local-plugins"),
    installPlugin: (pluginInfo) => ipcRenderer.invoke("install-plugin", pluginInfo),

    // Новый API
    getPluginsEnabled: () => ipcRenderer.invoke("get-plugins-enabled"),
    setPluginEnabled: (pluginFolder, enabled) => ipcRenderer.invoke("set-plugin-enabled", { pluginFolder, enabled })
});

window.addEventListener('DOMContentLoaded', () => {
    // Передаем контекст окна (renderer) в loadPlugins
    loadPlugins(window);
});

contextBridge.exposeInMainWorld("AccountApi", {
  register: async (email, password) => {
    const res = await fetch("http://localhost:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  login: async (email, password) => {
    const res = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  getMe: async () => {
    const res = await fetch("http://localhost:3000/me", {
      credentials: "include"
    });
    return res.json();
  }
});