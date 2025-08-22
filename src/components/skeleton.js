import {tagsData, filtersData}  from "./tags.js" 

export function initSkeletonLoading() {
  setTimeout(() => {
    document.querySelectorAll('.skeleton').forEach(el => {
      el.style.display = 'none';
    });

    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const tags = tagsData.map(tag => tag.name);

    const types = filtersData
    .filter(f => f.name) // убираем пустые
    .map(f => f.name.replace('Тип: '|| 'Рейтинг: ', '')); // убираем префиксы

    for (let i = 0; i < 20; i++) {
      const card = document.createElement('div');
      card.className = 'card';

      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomTags = Array.from({ length: 2 }, () => tags[Math.floor(Math.random() * tags.length)]);

      card.innerHTML = `      
        <div class="card-badge">${randomType}</div>
        <img class="card-img" src="https://placehold.co/300x400?text=Image+${i + 1}" alt="Preview">
        <div class="card-content">
          <div class="card-title">Изображения: #${i + 1}</div>
        </div>
        <div class="card-meta">
            <div class="card-tags-wrapper" style="margin-top: auto;">
              <div class="card-tags">
                ${randomTags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
              </div>
            </div>
          </div>
        <div class="card-actions">
          <button title="В избранное">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
            </svg>
          </button>
          <button title="Скачать">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
          </button>
        </div>`;

      gallery.appendChild(card);
      
      // Добавляем обработчик клика для открытия карточки
      card.addEventListener('click', (e) => {
        // игнорируем клики по кнопкам и ссылкам
        if (
          e.target.closest('button') ||
          e.target.closest('a') ||
          e.target.tagName === 'BUTTON'
        ) return;
        
        // Получаем данные карточки
        const cardData = {
          title: `Изображение #${i + 1}`,
          imageSrc: `https://placehold.co/300x400?text=Image+${i + 1}`,
          description: `Описание изображения #${i + 1}. Это прекрасное изображение с тегами: ${randomTags.join(', ')}.`,
          type: randomType,
          tags: randomTags,
          likes: 0,
          dislikes: 0,
          views: 0
        };
        
        // Открываем карточку
        openCardView(cardData);
      });
    }
  }, 1500);
}

// Функция для открытия просмотра карточки
function openCardView(cardData) {
  // Скрываем галерею
  const gallery = document.querySelector('.gallery-wrapper');
  if (gallery) {
    gallery.classList.add('hidden');
  }
  
  // Показываем карточку
  const cardView = document.querySelector('.card-active');
  if (cardView) {
    // Заполняем карточку данными
    cardView.querySelector('.viewer-image').src = cardData.imageSrc;
    cardView.querySelector('.viewer-image').alt = cardData.title;
    cardView.querySelector('.image-description').textContent = cardData.description;
    
    // Обновляем теги
    const tagsContainer = cardView.querySelector('.image-tags');
    tagsContainer.innerHTML = '';
    cardData.tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.textContent = `#${tag}`;
      tagsContainer.appendChild(tagElement);
    });
    
    // Обновляем лайки/дизлайки
    cardView.querySelector('.like-btn span').textContent = cardData.likes;
    cardView.querySelector('.dislike-btn span').textContent = cardData.dislikes;
    
    // Показываем карточку
    cardView.classList.remove('hidden');
    
    // Добавляем обработчик для кнопки закрытия
    const closeBtn = cardView.querySelector('.card-close');
    if (closeBtn) {
      closeBtn.onclick = closeCardView;
    }
  }
}

// Функция для закрытия просмотра карточки
function closeCardView() {
  // Скрываем карточку
  const cardView = document.querySelector('.card-active');
  if (cardView) {
    cardView.classList.add('hidden');
  }
  
  // Показываем галерею
  const gallery = document.querySelector('.gallery-wrapper');
  if (gallery) {
    gallery.classList.remove('hidden');
  }
}

export function filterGallery(selectedTag = null, selectedType = null) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const cards = gallery.querySelectorAll('.card');

    cards.forEach(card => {
        const cardTags = Array.from(card.querySelectorAll('.card-tags .tag'))
                              .map(el => el.textContent.replace('#', ''));

        const cardType = card.querySelector('.card-badge')?.textContent || '';

        const matchesTag = selectedTag ? cardTags.includes(selectedTag) : true;
        const matchesType = selectedType ? cardType === selectedType : true;

        card.style.display = matchesTag && matchesType ? 'block' : 'none';
    });
}