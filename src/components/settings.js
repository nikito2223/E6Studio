import { filterGallery } from './gallery.js';

const applyTranslations = () => {};
const initLanguageSwitcher = () => {};
const translations = {};

const electronAPI = window.electronAPI || {
  isPackaged: false,
  checkForUpdates: () => {},
  onUpdateInfo: () => {},
  onUpdateError: () => {},
  quitAndInstall: null
};

const appInfoFallback = window.appInfo?.get?.() || {
  version: '2.4.0',
  author: 'Rufik',
  license: 'MIT',
  name: 'E6 Studio'
};

const settings = [
  {
    name: "theme",
    title: "settings.theme.title", // ключ для перевода
    icon: "theme.svg",
    html: "assets/settings/theme.html"
  },
  {
    name: "plugins",
    title: "settings.plugins.title",
    icon: "plugins.svg",
    html: "assets/settings/plugins.html"
  },
  {
    name: "github",
    title: "settings.github.title",
    icon: "github.svg",
    html: "assets/settings/github.html"
  },
  {
    name: "content",
    title: "settings.content.title",
    icon: "content.svg",
    html: "assets/settings/content.html"
  },
  {
    name: "languages",
    title: "settings.languages.title",
    icon: "content.svg",
    html: "assets/settings/languages.html"
  },
  {
    name: "about",
    title: "settings.about.title",
    icon: "about.svg",
    html: "assets/settings/about.html"
  }
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
  // Инициализация
  initPasswordProtection();
}

async function loadSettingHTML(section, path) {
  try {
    const res = await fetch(path);
    const html = await res.text();
    section.innerHTML = html;
    applyTranslations(section);
  } catch (err) {
    section.innerHTML = `<p style="color:red;">Ошибка загрузки: ${err}</p>`;
  }
}

function initContentModes(container = document) {
  const maxRating = container.querySelector('#maxRatingSelect');
  if (!maxRating) return;

  const savedRating = localStorage.getItem('maxRating') || 'e';
  maxRating.value = savedRating;

  maxRating.addEventListener('change', () => {
    localStorage.setItem('maxRating', maxRating.value);
    filterGallery();
  });

  initBlacklistTags(container);
}



function initPasswordProtection() {
  const toggle = document.getElementById('app-password-toggle');
  const container = document.getElementById('password-input-container');
  const input = document.getElementById('app-password-input');

  if (!toggle && !input && !container) return; 
  
  // Загрузка сохранённого пароля
  const savedPassword = localStorage.getItem('appPassword');
  if (savedPassword) {
    toggle.checked = true;
    container.classList.remove('hidden');
    input.value = savedPassword; 
    requestPassword(savedPassword);
  }

  // Переключение включения/отключения пароля
  toggle.addEventListener('change', () => {
    container.classList.toggle('hidden', !toggle.checked);
    if (!toggle.checked) {
      localStorage.removeItem('appPassword');
      input.value = '';
    }
  });

  // Сохранение пароля при вводе
  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (val.length === 5) {
      localStorage.setItem('appPassword', val);
    } else {
      localStorage.removeItem('appPassword');
    }
  });
}


// Функция запроса пароля при старте
function requestPassword(correctPassword) {
  const overlay = document.createElement('div');
  overlay.classList.add('password-overlay');

  overlay.innerHTML = `
    <div class="password-modal">
      <h3>Введите пароль</h3>
      <input type="password" id="password-prompt-input" class="password-input" placeholder="Пароль">
      <p class="password-error" id="password-error" style="display:none;">Пароль должен быть минимум 5 символов</p>
      <button class="update-button" id="password-submit">🔒 Войти</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const inputPrompt = overlay.querySelector('#password-prompt-input');
  const submit = overlay.querySelector('#password-submit');
  const error = overlay.querySelector('#password-error');

  function checkPassword() {
    const val = inputPrompt.value.trim();
    if (val.length < 5) {
      error.textContent = 'Пароль должен быть минимум 5 символов';
      error.style.display = 'block';
      return;
    }

    if (val === correctPassword) {
      overlay.remove(); // снимаем блокировку
    } else {
      error.textContent = 'Неверный пароль';
      error.style.display = 'block';
    }
  }

  submit.addEventListener('click', checkPassword);
  inputPrompt.addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });
}




function showPasswordPrompt(correctPassword) {
  const overlay = document.createElement('div');
  overlay.classList.add('password-overlay');

  overlay.innerHTML = `
    <div class="password-modal">
      <button class="settings-close">&times;</button>
      <h3 data-i18n="password.promptTitle">Введите пароль</h3>
      <input type="password" id="password-prompt-input" data-i18n-placeholder="password.placeholder" placeholder="Пароль">
      <p class="password-error" id="password-error" data-i18n="password.error">Неверный пароль</p>
      <button class="update-button" id="password-submit">
        <span class="button-icon">🔒</span> <span data-i18n="password.submit">Войти</span>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Применяем перевод к модалке
  applyTranslations(overlay);

  // Закрытие
  overlay.querySelector('.settings-close').addEventListener('click', () => overlay.remove());

  const inputPrompt = overlay.querySelector('#password-prompt-input');
  const submit = overlay.querySelector('#password-submit');
  const error = overlay.querySelector('#password-error');

  function checkPassword() {
    if (inputPrompt.value === correctPassword) overlay.remove();
    else error.style.display = 'block';
  }

  submit.addEventListener('click', checkPassword);
  inputPrompt.addEventListener('keydown', e => { if(e.key === 'Enter') checkPassword(); });
}

function initBlacklistTags() {
    const input = document.querySelector('#content input[type="text"]');
    if (!input) return;
    const addBtn = input.nextElementSibling; // кнопка "+"
    const container = input.parentElement.nextElementSibling; // контейнер для тегов
    const blacklist = new Set(JSON.parse(localStorage.getItem('blacklistTags') || '[]'));

    function renderTags() {
        container.innerHTML = '';
        blacklist.forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag;
            span.style.cssText = `
              background: var(--bg-hover);
              padding: 5px 10px;
              border-radius: 20px;
              font-size: 0.9rem;
              cursor: pointer;
              margin-right: 5px;
            `;
            span.className = 'blacklist-tag';
            span.style.cursor = 'pointer';
            span.title = 'Удалить';
            span.addEventListener('click', () => {
                blacklist.delete(tag);
                localStorage.setItem('blacklistTags', JSON.stringify([...blacklist]));
                renderTags();
                filterGallery();
            });
            container.appendChild(span);
        });
    }

    addBtn.addEventListener('click', () => {
        const val = input.value.trim().toLowerCase();
        if (val && !blacklist.has(val)) {
            blacklist.add(val);
            localStorage.setItem('blacklistTags', JSON.stringify([...blacklist]));
            input.value = '';
            renderTags();
            filterGallery();
        }
    });

    // Enter для добавления
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addBtn.click();
    });

    renderTags();
}

function initIncognitoMode() {
  const incognitoToggle = document.getElementById('incognito-toggle');
  const incognitoButton = document.getElementById('incognito-mode');

  if (!incognitoToggle || !incognitoButton) return;


  incognitoToggle.addEventListener('change', function () {
    incognitoButton.style.backgroundColor = this.checked ? 'var(--accent)' : '';
  });

  incognitoButton.addEventListener('click', function () {
    incognitoToggle.checked = !incognitoToggle.checked;
    this.style.backgroundColor = incognitoToggle.checked ? 'var(--accent)' : '';
  });
}




async function initSetting() {
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
  for (const [i, s] of settings.entries()) {
    const btn = document.createElement("button");
    const svg = await loadIconSVG(`assets/icons/${s.icon}`);
  
    // Вставляем ключ для перевода
    btn.innerHTML = `${svg} <span data-i18n="${s.title}">${s.title}</span>`;
    btn.dataset.tab = s.name;
    if (i === 0) btn.classList.add("active");
    if (s.name === "github") btn.classList.add("hidden");
    tabsContainer.appendChild(btn);
  
    const section = document.createElement("div");
    section.classList.add("settings-section");
    if (i === 0) section.classList.add("active");
    section.id = s.name;
    await loadSettingHTML(section, s.html);
    contentContainer.appendChild(section);
  
    btn.addEventListener("click", () => openTab(s.name));
  
    if (s.name === "theme") initThemeSwitcher(section);
    if (s.name === "content") {
      initContentModes(section);
      initPasswordProtection();
    }
    if (s.name === "about") initUpdate(section);
    if (s.name === "languages") initLanguageSwitcher(section);
  }
  
  // После генерации всех вкладок применяем переводы
  applyTranslations(tabsContainer);
  applyTranslations(contentContainer);



  // обработка кнопок внутри секций (например github в plugins)
  contentContainer.querySelectorAll('button[data-tab]').forEach(innerBtn => {
    const tabName = innerBtn.getAttribute('data-tab');
    innerBtn.addEventListener('click', () => openTab(tabName));
  });

  openSettingsBtn.addEventListener('click', () => settingsOverlay.classList.add('active'));
  closeSettingsBtn.addEventListener('click', () => settingsOverlay.classList.remove('active'));

  // Закрытие при клике вне окна
  settingsOverlay.addEventListener('click', e => {
    if (e.target === settingsOverlay) settingsOverlay.classList.remove('active');
  });
}


async function loadIconSVG(path) {
  try {
    const res = await fetch(path);
    const svgText = await res.text();
    return svgText;
  } catch (err) {
    console.error(`Ошибка загрузки SVG: ${err}`);
    return `<span style="color:red;">⚠</span>`; // fallback
  }
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


function initUpdate(container = document) {
  const checkBtn = container.querySelector('#check-update');
  const updateStatus = container.querySelector('#update-status');
  if (!checkBtn || !updateStatus) return;

  const statusText = updateStatus.querySelector('.status-text');

  // Эмуляция апдейта для дев режима
  if (!electronAPI.isPackaged) { // проверка dev/production
    const fakeUpdate = {
      version: "1.2.0-dev",
      changelog: [
        "- Добавлена новая функция X",
        "- Исправлен баг Y",
        "> Обновлён дизайн"
      ]
    };
    showUpdateModal(fakeUpdate);
    statusText.textContent = `Доступна версия ${fakeUpdate.version} (dev mode)`;
    return; // выходим, чтобы не делать реальную проверку
  }

  checkBtn.addEventListener('click', () => {
    statusText.textContent = 'Проверяем обновления...';
    checkBtn.classList.add('loading');
    electronAPI.checkForUpdates();
  });

  electronAPI.onUpdateInfo((info) => {
    checkBtn.classList.remove('loading');

    if (info.version === null) {
      statusText.textContent = '✅ Обновлений нет. Вы используете последнюю версию.';
    } else {
      statusText.textContent = `Доступна версия ${info.version}`;
      showUpdateModal(info); // показываем модалку с обновлением
    }
    checkBtn.classList.remove('loading');
  });

  electronAPI.onUpdateError((err) => {
    updateStatus.className = 'status-container error';
    statusText.textContent = `❌ Ошибка проверки обновлений: ${err}`;
    checkBtn.classList.remove('loading');
  });
}


function showUpdateModal(info) {
  const overlay = document.createElement('div');
  overlay.classList.add('password-overlay');



  overlay.innerHTML = `
    <div class="password-modal">
      <button class="settings-close">&times;</button>
      <h3>Доступно обновление до версии ${info.version}</h3>
      <div class="card-section">
        <p><strong>Что нового:</strong></p>
        <div id="changelog-list" style="margin-left: 15px;"></div>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
        <button id="cancel-update" class="update-button" style="background:#ccc; color:#000;">Отмена</button>
        <button id="confirm-update" class="update-button">Обновить</button>
      </div>
    </div>
  `;


  

  document.body.appendChild(overlay);

  overlay.querySelector('.settings-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#cancel-update').addEventListener('click', () => overlay.remove());

  overlay.querySelector('#confirm-update').addEventListener('click', () => {
    overlay.remove();
    // безопасно вызываем quitAndInstall только если оно определено
    if (electronAPI.quitAndInstall) electronAPI.quitAndInstall();
  });

  const changelogEl = overlay.querySelector('#changelog-list');
  (info.changelog || []).forEach(line => {
    const el = document.createElement(line.startsWith("-") ? "li" : "p");
    el.textContent = line.replace(/^[-|>]\s?/, "");
    changelogEl.appendChild(el);
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

async function about() {
    const infoApp = appInfoFallback;
    const info = await checkForUpdates();
    if (!info) return;

    const appVersionEl = document.getElementById("app-version");
    const appVersionNewEl = document.getElementById("app-version-new");
    const appAuthorEl = document.getElementById("app-author");
    const appLicenseEl = document.getElementById("app-license");
    const changelogElement = document.getElementById("changelog");

    if (appVersionEl) appVersionEl.textContent = infoApp.version;
    if (appVersionNewEl) appVersionNewEl.textContent = info.version;
    if (appAuthorEl) appAuthorEl.textContent = infoApp.author;
    if (appLicenseEl) appLicenseEl.textContent = infoApp.license;

    if (changelogElement) {
        changelogElement.innerHTML = "";
        info.changelog.forEach(line => {
            const el = document.createElement(
                line.startsWith("-") ? "li" : line.startsWith(">") ? "blockquote" : "p"
            );
            el.textContent = line.replace(/^[-|>]\s?/, "");
            changelogElement.appendChild(el);
        });
    }
}

async function checkForUpdates() {
  try {
    const owner = 'nikito2223';
    const repo = 'E6Studio';
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
    if (!response.ok) {
      return {
        version: appInfoFallback.version,
        changelog: ['Не удалось получить обновления (API недоступен).']
      };
    }

    const release = await response.json();
    return {
      version: release.tag_name || appInfoFallback.version,
      changelog: (release.body || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    };
  } catch (err) {
    console.error('Ошибка проверки обновлений:', err);
    return {
      version: appInfoFallback.version,
      changelog: ['Ошибка сети при проверке обновлений.']
    };
  }
}
