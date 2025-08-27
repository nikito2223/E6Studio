import { checkForUpdates } from "../plugins/updater.js";

const settings = [
    {
      name: "theme",
      title: "Темы",
      description: `
        <h3>Темы оформления</h3>
        <p>Выберите внешний вид приложения:</p>
        <div class="theme-options">
        </div>
      `,
      icon: `        
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Солнце/Луна -->
          <mask id="moon-mask">
            <rect x="0" y="0" width="24" height="24" fill="white"/>
            <circle cx="17" cy="7" r="8" fill="black"/>
          </mask>
          <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" mask="url(#moon-mask)"/>
          
          <!-- Лучи солнца -->
          <g class="sun-rays">
            <path d="M12 5V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M19 12H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M12 19V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M5 12H3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M16.95 7.05L18.36 5.64" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M5.64 18.36L7.05 16.95" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M7.05 7.05L5.64 5.64" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M18.36 18.36L16.95 16.95" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </g>
        </svg>`
    },
    {
      name: "plugins",
      title: "Плагины",
      description: `
        <h3>Плагины</h3>
        <p>Плагины и Модули</p>
        <button data-tab="github" class="github-button">GitHub</button>
        <div class="plugins-tab">
          
        </div>
      `,
      icon: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 8H16V16H8V8Z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 8V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M12 20V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M8 12H4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M20 12H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
        </svg>
      `
    },
    {
      name: "github",
      title: "GitHub",
      description: `
        <h3>Поиск плагинов на GitHub</h3>
        <p>Плагины с тегом <code>E6-Plugin</code>:</p>
        <div class="github-tab">  
        </div> 
      `,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.9 9.5.5.1.6-.2.6-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.2-1.4-1.2-1.4-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.8-1.4 2.9-1.4 2.1 0 1.9 1.5 2.9 1.4 0 0 .6-1.1 1.7-1.2 0 0 1.1 0 .1.7 0 0-.7.3-1.2 1.4 0 0-.6 1.8-3.4 1.2v1.7c0 .3.1.6.6.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z" fill="currentColor"/></svg>`
    },
    {
      name: "content",
      title: "Контент",
      description: `
        <h3>Фильтры контента</h3>
        <p>Настройка отображаемого контента:</p>
        
        <div style="margin-top: 20px;">
          <div style="margin-bottom: 20px;">
            <label><strong>Максимальный рейтинг:</strong></label>
            <select style="display: block; width: 100%; padding: 10px; margin-top: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);">
              <option>Safe</option>
              <option>Questionable</option>
              <option selected>Explicit</option>
            </select>
          </div>
          
          <div style="margin-bottom: 20px;">
            <label><strong>Черный список тегов:</strong></label>
            <div style="display: flex; margin-top: 8px;">
              <input type="text" placeholder="Добавить тег..." style="flex: 1; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px 0 0 8px; color: var(--text-primary);">
              <button style="padding: 10px 15px; background: var(--accent); color: white; border: none; border-radius: 0 8px 8px 0; cursor: pointer;">+</button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
              <span style="background: var(--bg-hover); padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">guro</span>
              <span style="background: var(--bg-hover); padding: 5px 10px; border-radius: 20px; font-size: 0.9rem;">scat</span>
            </div>
          </div>
        </div>
        <p>Настройки приватности и безопасности:</p>
        
        <div style="margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-card); border-radius: 10px; margin-bottom: 10px;">
            <div>
              <strong>Режим инкогнито</strong>
              <p style="margin-top: 5px; font-size: 0.9em;">Не сохранять историю просмотров</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="incognito-toggle">
              <span class="slider"></span>
            </label>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-card); border-radius: 10px; margin-bottom: 10px;">
            <div>
              <strong>Автоочистка кэша</strong>
              <p style="margin-top: 5px; font-size: 0.9em;">Удалять кэш при выходе</p>
            </div>
            <label class="switch">
              <input type="checkbox" checked>
              <span class="slider"></span>
            </label>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: var(--bg-card); border-radius: 10px;">
            <div>
              <strong>Пароль на приложение</strong>
              <p style="margin-top: 5px; font-size: 0.9em;">Защита паролем при запуске</p>
            </div>
            <label class="switch">
              <input type="checkbox">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      `,
      icon: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M7 12H17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M10 18H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle class="filter-dot" cx="5" cy="6" r="1" fill="currentColor"/>
          <circle class="filter-dot" cx="12" cy="12" r="1" fill="currentColor"/>
          <circle class="filter-dot" cx="19" cy="18" r="1" fill="currentColor"/>
          <path d="M15 9L18 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
       `
    },
    {
      name: "about",
      title: "О приложении",
      description: `
        <h3>Приложения</h3>
        <p class="description">E6 Studio – это удобный лаунчер для E621, созданный для быстрого и комфортного доступа к популярной анимационной арт-платформе.</p>
        <p><strong>Версия:</strong> <span id="app-version"></span></p>
        <p><strong>Разработчик:</strong> <span id="app-author"></span></p>
        <p><strong>Лицензия:</strong> <span id="app-license"></span></p>
        <div style="margin-top: 20px; padding: 15px; background: var(--bg-card); border-radius: 10px;">
          <p><strong>Что нового в версии <span id="app-version-new"></span>:</strong></p>
          <ul id="changelog" style="margin: 10px 0 10px 20px;">
          </ul>
        </div>

        <div class="update-container">
          <button id="check-update" class="update-button">
            <span class="button-icon">🔄</span>
            Проверить обновления
          </button>
          <div id="update-status" class="status-container">
            <div class="status-icon">⏳</div>
            <p class="status-text">Готов к проверке</p>
          </div>
        </div>
      `,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 8V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`
    },
];

export async function initSettings() {
  init();
  initUpdate();
  await about();
}

function init(){
  initSetting();
  initContentModes();
  initViewModes();
  initThemeSwitcher();
  initIncognitoMode();
}


function initContentModes() {
  const modeButtons = document.querySelectorAll('.mode-btn');

  modeButtons.forEach(button => {
    button.addEventListener('click', function () {
      modeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
}
function initIncognitoMode() {
  const incognitoToggle = document.getElementById('incognito-toggle');
  const incognitoButton = document.getElementById('incognito-mode');

  incognitoToggle.addEventListener('change', function () {
    incognitoButton.style.backgroundColor = this.checked ? 'var(--accent)' : '';
  });

  incognitoButton.addEventListener('click', function () {
    incognitoToggle.checked = !incognitoToggle.checked;
    this.style.backgroundColor = incognitoToggle.checked ? 'var(--accent)' : '';
  });
}
function initSetting() {
  const openSettingsBtn = document.getElementById('open-settings');
  const closeSettingsBtn = document.getElementById('close-settings');
  const settingsOverlay = document.getElementById('settings-overlay');
  const tabsContainer = document.getElementById("settings-tabs");
  const contentContainer = document.getElementById("settings-content");
  if (!tabsContainer || !contentContainer) return;

  function openTab(tabName) {
    tabsContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    contentContainer.querySelectorAll(".settings-section").forEach(s => s.classList.remove("active"));

    const tabButton = tabsContainer.querySelector(`button[data-tab="${tabName}"]`);
    const tabSection = contentContainer.querySelector(`.settings-section#${tabName}`);

    if (tabButton && tabSection) {
      tabButton.classList.add("active");
      tabSection.classList.add("active");
    }
  }

// создаем вкладки и секции
  settings.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = `${s.icon} ${s.title}`;
    btn.dataset.tab = s.name;
    if (i === 0) btn.classList.add("active");
    if (i == 2) btn.classList.add("hidden"); // скрытая вкладка
    tabsContainer.appendChild(btn);

    const section = document.createElement("div");
    section.classList.add("settings-section");
    if (i === 0) section.classList.add("active");
    section.id = s.name;
    section.innerHTML = s.description;
    contentContainer.appendChild(section);

    // открытие вкладки при клике на кнопку
    btn.addEventListener("click", () => openTab(s.name));
  });

  // !!! ОБРАБОТКА ВСЕХ BUTTON DATA-TAB В КОНТЕНТЕ !!!
  contentContainer.querySelectorAll('button[data-tab]').forEach(innerBtn => {
    const tabName = innerBtn.getAttribute('data-tab');
    innerBtn.addEventListener('click', () => openTab(tabName));
  });

  openSettingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.add('active');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsOverlay.classList.remove('active');
  });

  const settingsButtons = document.querySelectorAll('.settings-left button');
  const settingsSections = document.querySelectorAll('.settings-section');

  settingsButtons.forEach(button => {
    button.addEventListener('click', function () {
      const tabId = this.getAttribute('data-tab');

      settingsButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      settingsSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === tabId) section.classList.add('active');
      });
    });
  });

  // Закрытие при клике вне окна
  settingsOverlay.addEventListener('click', e => {
    if (e.target === settingsOverlay) {
      settingsOverlay.classList.remove('active');
    }
  });
}
function initThemeSwitcher() {
  const themes = [
    { id: 'light', name: 'Светлая', accent: " #6c5ce7" },
    { id: 'dark', name: 'Тёмная', accent: "#2ec4b6"},
    { id: 'blue', name: 'Синяя', accent: "#5aa7ff" },
    { id: 'red', name: 'Красный', accent: "#e85a4f" }
  ];

  const themeContainer = document.querySelector('#theme .theme-options');
  if (!themeContainer) return;

  // Очистим контейнер на случай перезагрузки
  themeContainer.innerHTML = '';

  themes.forEach(theme => {
    const btn = document.createElement('div');
    btn.className = 'theme-btn';
    btn.setAttribute('data-theme', theme.id);
    btn.innerHTML = `
      <div class="theme-preview">
        <div class="preview-sidebar"></div>
        <div class="preview-main"></div>
        <div class="preview-accent" style="background: ${theme.accent};"></div>
      </div>
      <span>${theme.name}</span>
    `;
    themeContainer.appendChild(btn);
  });

  const themeButtons = themeContainer.querySelectorAll('.theme-btn');

  function applyTheme(theme) {
    document.body.className = `${theme}-theme`;
    localStorage.setItem('theme', theme);

    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }

  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme');
      applyTheme(theme);
    });
  });

  // Подгружаем сохранённую тему
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
}
function initUpdate() {
    const checkBtn = document.getElementById('check-update');
    const updateStatus = document.getElementById('update-status');

    // если элементов нет → просто выходим, чтобы не крашило
    if (!checkBtn || !updateStatus) return;

    const statusText = updateStatus.querySelector('.status-text');

    checkBtn.addEventListener('click', () => {
        checkBtn.classList.add('loading');
        updateStatus.className = 'status-container checking';
        statusText.textContent = 'Проверяем обновления...';

        window.electronAPI.checkForUpdates();
    });

    window.electronAPI.onUpdateInfo((info) => {
        if (info.version === null) {
            updateStatus.className = 'status-container up-to-date';
            statusText.textContent = '✅ Обновлений нет. Вы используете последнюю версию.';
        } else {
            updateStatus.className = 'status-container available';
            statusText.textContent = `Доступно обновление до версии ${info.version}, размер: ${info.size} MB. Скачивается...`;
        }
        checkBtn.classList.remove('loading');
    });

    window.electronAPI.onUpdateError((err) => {
        updateStatus.className = 'status-container error';
        statusText.textContent = `❌ Ошибка проверки обновлений: ${err}`;
        checkBtn.classList.remove('loading');
    });
}
function initViewModes() {
  const viewButtons = document.querySelectorAll('.view-btn');
  const gallery = document.getElementById('gallery');

  viewButtons.forEach(button => {
    button.addEventListener('click', function () {
      const viewType = this.getAttribute('data-view');

      viewButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      gallery.classList.toggle('list-view', viewType === 'list');
    });
  });
}

async function about(){
  const infoApp = window.appInfo.get();

  const info = await checkForUpdates();
  if (!info) return;

  document.getElementById("app-version").textContent = infoApp.version;
  document.getElementById("app-version-new").textContent = info.version;
  document.getElementById("app-author").textContent = infoApp.author;
  document.getElementById("app-license").textContent = infoApp.license;

  const changelogElement = document.getElementById("changelog");
  changelogElement.innerHTML = "";

  info.changelog.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    changelogElement.appendChild(li);
  });

}