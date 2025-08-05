export function initThemeSwitcher() {
  const themeButtons = document.querySelectorAll('.theme-btn');
  const themeSwitcher = document.getElementById('theme-switcher');

  themeButtons.forEach(button => {
    button.addEventListener('click', function () {
      const theme = this.getAttribute('data-theme');

      themeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      document.body.className = `${theme}-theme`;
      localStorage.setItem('theme', theme);
    });
  });

  themeSwitcher.addEventListener('click', () => {
    const themes = ['dark', 'light', 'blue', 'purple'];
    const currentTheme = document.body.className.replace('-theme', '');
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];

    document.body.className = `${nextTheme}-theme`;
    localStorage.setItem('theme', nextTheme);

    themeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-theme') === nextTheme) {
        btn.classList.add('active');
      }
    });
  });

  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.className = `${savedTheme}-theme`;

  themeButtons.forEach(btn => {
    if (btn.getAttribute('data-theme') === savedTheme) {
      btn.classList.add('active');
    }
  });
}
