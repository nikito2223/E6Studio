const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require("electron-updater");
const path = require('path');
const fs = require("fs");
const https = require("https");
const AdmZip = require("adm-zip");
const { loadPlugins } = require("./src/plugins/loadPlugins");

let mainWindow;

const pluginsDir = path.join(app.getPath("userData"), "plugins");
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

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
  loadPlugins();

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
// IPC для установки плагина
ipcMain.handle("install-plugin", async (event, { name, repoFullName }) => {
  const zipUrl = `https://codeload.github.com/${repoFullName}/zip/refs/heads/main`;
  const zipPath = path.join(pluginsDir, `${name}.zip`);
  const pluginDir = path.join(pluginsDir, name);

  // Скачиваем архив
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(zipPath);
    https.get(zipUrl, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", reject);
  });

  // Распаковываем архив прямо в pluginDir, без лишней вложенной папки
  try {
    const zip = new AdmZip(zipPath);
    // Находим корневую папку архива (обычно что-то вида E6PluginExample-main)
    const rootFolderName = zip.getEntries()[0].entryName.split("/")[0];
    zip.getEntries().forEach(entry => {
      const relativePath = entry.entryName.replace(rootFolderName + "/", "");
      if (!relativePath) return; // пропускаем корень
      const targetPath = path.join(pluginDir, relativePath);
      if (entry.isDirectory) {
        fs.mkdirSync(targetPath, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, entry.getData());
      }
    });
  } catch (err) {
    console.error("Ошибка распаковки плагина:", err);
    throw err;
  }

  // Читаем plugins.json после распаковки
  let pluginData;
  try {
    const pluginJsonPath = path.join(pluginDir, "plugins.json");
    pluginData = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));
    pluginData.enabled = true;
  } catch (err) {
    console.error("Ошибка чтения plugins.json после установки:", err);
    throw err;
  }

  return pluginData;
});
ipcMain.handle("get-local-plugins", async () => {
    const pluginsDir = path.join(app.getPath("userData"), "plugins");
    if (!fs.existsSync(pluginsDir)) return [];

    const folders = fs.readdirSync(pluginsDir);
    const plugins = [];

    for (const folder of folders) {
        const pluginJsonPath = path.join(pluginsDir, folder, "plugins.json");
        if (!fs.existsSync(pluginJsonPath)) continue;

        const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, "utf8"));

        // Абсолютный путь к иконке
        if (plugin.icon) {
            const iconPath = path.join(pluginsDir, folder, plugin.icon);
            plugin.icon = `file://${iconPath.replace(/\\/g, "/")}`;
        }

        plugin.enabled = false;
        plugins.push(plugin);
    }

    return plugins;
});

function getPluginsStatePath() {
    return path.join(app.getPath("userData"), "plugin-enable.json");
}

// Читаем состояния плагинов
function readPluginsState() {
    const statePath = getPluginsStatePath();
    if (!fs.existsSync(statePath)) return {};
    try {
        return JSON.parse(fs.readFileSync(statePath, "utf8"));
    } catch (err) {
        console.error("Ошибка чтения plugin-enable.json:", err);
        return {};
    }
}

// Записываем состояния плагинов
function writePluginsState(state) {
    const statePath = getPluginsStatePath();
    try {
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
    } catch (err) {
        console.error("Ошибка записи plugin-enable.json:", err);
    }
}

// API для получения всех состояний
ipcMain.handle("get-plugins-enabled", () => {
    return readPluginsState();
});

// API для изменения состояния плагина
ipcMain.handle("set-plugin-enabled", (event, { pluginFolder, enabled }) => {
    const state = readPluginsState();
    state[pluginFolder] = enabled;
    writePluginsState(state);
    return { success: true };
});

