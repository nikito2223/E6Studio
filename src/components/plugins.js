
// Глобально в начале файла
let LOCAL_PLUGINS = [];

const APP_VERSION = window.appInfo.get().version;
const GITHUB_TAG = "E6-Plugin";

// Загружаем список локальных плагинов через preload
async function loadLocalPlugins() {
    try {
        const plugins = await window.pluginAPI.getLocalPlugins();
        const enabledState = await window.pluginAPI.getPluginsEnabled();

        // Добавляем поле enabled из файла plugin-enable.json
        return plugins.map(plugin => {
            const folderName = plugin.folder || plugin.name;
            plugin.enabled = !!enabledState[folderName];
            plugin.installed = true; // локальные плагины считаем установленными
            return plugin;
        });
    } catch (err) {
        console.error("Ошибка загрузки локальных плагинов:", err);
        return [];
    }
}

// Рендер списка плагинов
function renderPluginList(container, plugins) {

    if (!container) return;

    container.innerHTML = "";
    plugins.forEach(plugin => {
        const el = document.createElement("div");
        el.className = "plugin-item";

        el.innerHTML = `
            <div class="plugin-icon">
                <img src="${plugin.icon}" alt="">
            </div>
            <div class="plugin-info">
                <div class="plugin-top">
                    <strong>${plugin.name}</strong>
                    ${plugin.version ? `<span class="plugin-version">${plugin.version}</span>` : ""}
                    <div class="plugin-control"></div>
                </div>
                <p class="plugin-desc">${plugin.description || ""}</p>
                <p class="plugin-author">${plugin.author || ""}</p>
            </div>
        `;

        const controlContainer = el.querySelector(".plugin-control");

        if (plugin.installed) {
            // Если установлен — показываем тумблер
            const toggle = document.createElement("input");
            toggle.type = "checkbox";
            toggle.checked = plugin.enabled;

            toggle.addEventListener("change", async e => {
                plugin.enabled = e.target.checked;
                const folderName = plugin.folder || plugin.name;
                await window.pluginAPI.setPluginEnabled(folderName, plugin.enabled);
                console.log(`Плагин ${plugin.name} ${plugin.enabled ? "включен" : "выключен"}`);
            });

            const label = document.createElement("label");
            label.className = "switch";
            label.appendChild(toggle);

            const span = document.createElement("span");
            span.className = "slider";
            label.appendChild(span);

            controlContainer.appendChild(label);
        } else if (plugin.repoFullName) {
            // Если не установлен — показываем кнопку «Установить»
            const installBtn = document.createElement("button");
            installBtn.textContent = "Установить";
            installBtn.className = "plugin-download"

            installBtn.addEventListener("click", async () => {
                try {
                    const installedPlugin = await window.pluginAPI.installPlugin(plugin);
                    installedPlugin.enabled = false; // по умолчанию выключен
                    installedPlugin.installed = true;
                    LOCAL_PLUGINS.push(installedPlugin);
                    renderPluginList(document.querySelector(".plugins-tab"), LOCAL_PLUGINS);
                    console.log(`Плагин ${plugin.name} установлен`);
                } catch (err) {
                    console.error(`Ошибка установки ${plugin.name}:`, err);
                }
            });

            controlContainer.appendChild(installBtn);
        }

        container.appendChild(el);
    });
}

// Поиск плагинов на GitHub
async function searchGitHubPlugins() {
    const res = await fetch(`https://api.github.com/search/repositories?q=topic:${GITHUB_TAG}&per_page=10`);
    const data = await res.json();
    return data.items || [];
}

// Загрузка plugins.json из репозитория
async function loadPluginFromRepo(repo) {
    const rawUrl = `https://raw.githubusercontent.com/${repo.full_name}/main/plugins.json`;
    try {
        const res = await fetch(rawUrl);
        if (!res.ok) return null;
        const plugin = await res.json();

        if (plugin["version-app"] && !isVersionCompatible(plugin["version-app"], APP_VERSION)) {
            console.warn(`Плагин ${plugin.name} не совместим с текущей версией приложения`);
            plugin.incompatible = true;
        }

        plugin.icon = `https://raw.githubusercontent.com/${repo.full_name}/main/${plugin.icon}`;
        plugin.enabled = false;
        plugin.repoFullName = repo.full_name;
        plugin.installed = false;
        return plugin;
    } catch (err) {
        console.error(`Ошибка загрузки ${repo.full_name}/plugins.json`, err);
        return null;
    }
}

function isVersionCompatible(required, current) {
    const reqParts = required.split(".").map(Number);
    const curParts = current.split(".").map(Number);

    for (let i = 0; i < reqParts.length; i++) {
        if ((curParts[i] || 0) > reqParts[i]) return true;   // текущая выше
        if ((curParts[i] || 0) < reqParts[i]) return false;  // текущая ниже
    }
    return true; // равны
}


// Инициализация вкладки плагинов
export async function initPluginsMenu() {
    const containerPlugins = document.querySelector(".plugins-tab");
    const containerGitHub = document.querySelector(".github-tab");

    if (!containerPlugins || !containerGitHub) {
        console.error("Элементы плагинов не найдены!");
        return;
    }

    // Загружаем локальные плагины + состояния
    LOCAL_PLUGINS = await loadLocalPlugins();
    renderPluginList(containerPlugins, LOCAL_PLUGINS);

    // Загружаем плагины с GitHub
    containerGitHub.innerHTML = "<p>Поиск плагинов на GitHub...</p>";
    try {
        const repos = await searchGitHubPlugins();
        const githubPlugins = [];
        for (const repo of repos) {
            const plugin = await loadPluginFromRepo(repo);
            if (plugin) githubPlugins.push(plugin);
        }
        renderPluginList(containerGitHub, githubPlugins);
    } catch (err) {
        containerGitHub.innerHTML = "<p>Ошибка поиска плагинов</p>";
        console.error(err);
    }
}