export function initSettingsMenu() {
  const settings = [
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
      `,
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 8V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`
    },
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
      name: "privacy",
      title: "Безопасность",
      description: `
        <h3>Безопасность</h3>
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
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M15 5.5L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M19 9L20 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M19 15L20 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M15 18.5L16 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 18.5L8 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M5 15L4 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M5 9L4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 5.5L8 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`
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
      name: "update",
      title: "Обновления",
      description: `
        <h3>Приложения и обновления</h3>
        <p>Настройки обновления</p>
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
      icon: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="5" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <rect x="5" y="14" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>
          <path class="update-arrow" d="M16 9C19 9 21 11 21 14C21 17 19 19 16 19" stroke="currentColor" stroke-width="1.5"        stroke-linecap="round"/>
          <path class="update-arrow" d="M14 16L16 19L18 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"         stroke-linejoin="round"/>
        </svg>
      `
    }
  ];

  const tabsContainer = document.getElementById("settings-tabs");
  const contentContainer = document.getElementById("settings-content");

  settings.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.innerHTML = `${s.icon} ${s.title}`;
    btn.dataset.tab = s.name;
    if (i === 0) btn.classList.add("active");
    tabsContainer.appendChild(btn);

    const section = document.createElement("div");
    section.classList.add("settings-section");
    if (i === 0) section.classList.add("active");
    section.id = s.name;
    section.innerHTML = s.description;
    contentContainer.appendChild(section);

    btn.addEventListener("click", () => {
      document.querySelectorAll("#settings-tabs button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".settings-section").forEach(sec => sec.classList.remove("active"));
      btn.classList.add("active");
      section.classList.add("active");
    });
  });
}
