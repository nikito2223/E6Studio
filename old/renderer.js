const gallery = document.getElementById('gallery');
// Открытие/закрытие настроек
const settingsOverlay = document.getElementById('settings-overlay');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const settingsContent = document.getElementById('settings-content');


document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.settings-left button');
  const closeBtn = document.getElementById('close-settings');


  // Кнопка открытия настроек
  const openBtn = document.getElementById('open-settings');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      settingsOverlay.classList.remove('hidden');
    });
  }

  // Кнопка закрытия
  closeBtn.addEventListener('click', () => {
    settingsOverlay.classList.add('hidden');
  });

  // Переключение вкладок
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if (tab === 'about') {
        const info = window.appInfo.get();

        settingsContent.innerHTML = `
          <h2>О приложении</h2>
          <p><strong>Название:</strong> ${info.name}</p>
          <p><strong>Версия:</strong> ${info.version}</p>
          <p><strong>Описание:</strong> ${info.description}</p>
          <p><strong>Автор:</strong> ${info.author}</p>
        `;
      } else if (tab === 'theme') {
        settingsContent.innerHTML = `
          <h2>Темы</h2>
          <p>Здесь будет выбор между тёмной и светлой темой.</p>
        `;
      } else {
        settingsContent.innerHTML = `<p>Нет данных для этой вкладки</p>`;
      }
    });
  });
});

const sidebar = document.querySelector('.sidebar');


openSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.toggle('hidden');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsOverlay.classList.add('hidden');
});

// Показываем скелетоны
function showSkeletons(count = 12) {
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'card skeleton';

    const image = document.createElement('div');
    image.className = 'skeleton-img';

    const title = document.createElement('div');
    title.className = 'skeleton-title';

    card.appendChild(image);
    card.appendChild(title);
    gallery.appendChild(card);
  }
}

function removeSkeletons() {
  document.querySelectorAll('.skeleton').forEach(el => el.remove());
}

// Показать скелетоны, потом настоящие данные
showSkeletons();

setTimeout(async () => {
  removeSkeletons();

  const images = await window.api.getImages();
  for (const img of images) {
    const card = document.createElement('div');
    card.className = 'card';

    const image = document.createElement('img');
    image.src = img.thumb;

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = img.title;

    card.appendChild(image);
    card.appendChild(title);
    gallery.appendChild(card);

    card.onclick = () => {
      alert(`Открыть: ${img.title}`);
    };
  }
}, 2000);
