export function initSettings() {
  const openSettingsBtn = document.getElementById('open-settings');
  const closeSettingsBtn = document.getElementById('close-settings');
  const settingsOverlay = document.getElementById('settings-overlay');

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
