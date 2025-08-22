export function initThemeSwitcher() {
  const themes = [
    { id: 'dark', name: 'Тёмная', accent: "#ff6b8b"},
    { id: 'light', name: 'Светлая', accent: " #e91e63" },
    { id: 'blue', name: 'Синяя', accent: "#9c5cff" },
    { id: 'purple', name: 'Фиолетовая', accent: "#8b5cf6" }
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
