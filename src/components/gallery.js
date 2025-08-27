// Данные для тегов
const tagsData = [
    { name: 'Minecraft', count: '42K' },
    { name: 'Stalker', count: '42K' },
    { name: 'Robot', count: '42K' },
    { name: '2', count: '42K' },
    { name: '3', count: '42K' },
];

// Данные для фильтров
const filtersData = [
    { name: 'Рейтинг: Safe' },
    { name: 'Рейтинг: Questionable' },
    { name: 'Рейтинг: Explicit', },
    { name: 'Тип: Изображения' },
    { name: 'Тип: Анимации' },
    { name: 'Тип: Видео' }
];

// Данные для коллекций
const collectionsData = [
    { name: 'Избранное ★' },
    { name: 'История просмотров' },
    { name: 'Черный список' },
    { name: 'Лучшее за месяц' }
];

export function initGalleryLoading(){
    initSkeletonLoading();
    initTag();
}


function initSkeletonLoading() {
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


//============================Tags===========================//


function initTag(){
    initTagList();
    initTagFilters();
    initFilters();
    initCollections();
    setupSearch();
    webcloud();
}


// Функция создания элемента тега
function createTagElement(tag, isActive = false) {
    const li = document.createElement('li');
    if (isActive) li.classList.add('active');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = tag.name;

    const countSpan = document.createElement('span');
    countSpan.className = 'tag-count';
    countSpan.textContent = tag.count;

    li.appendChild(nameSpan);
    li.appendChild(countSpan);

    li.addEventListener('click', () => {
        document.querySelectorAll('#tagList li').forEach(item => {
            item.classList.remove('active');
        });
        li.classList.add('active');
    });

    return li;
}

// Функция создания элемента списка
function createListItem(text, isActive = false) {
    const li = document.createElement('li');
    li.textContent = text;
    if (isActive) li.classList.add('active');

    li.addEventListener('click', () => {
        li.parentElement.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
    
        // получаем выбранный тег или тип
        const selectedTag = document.querySelector('#tagList li.active')?.querySelector('span:first-child')?.textContent || null;
        const selectedType = document.querySelector('#filterList li.active')?.textContent.replace('Тип: ', '') || null;
    
        filterGallery(selectedTag, selectedType);
    });

    return li;
}

// В initTagFilters добавляем обработку кнопки "Все"
export function initTagFilters() {
    const tagList = document.getElementById('tagList'); 
    const filterList = document.getElementById('filterList'); 

    // Добавляем кнопку "Все" в фильтры типов
    const allFilter = createListItem('Все', true); // по умолчанию активна
    filterList.prepend(allFilter);

    function getActiveTag() {
        const active = tagList.querySelector('li.active');
        return active ? active.querySelector('span')?.textContent : null;
    }

    function getActiveType() {
        const active = filterList.querySelector('li.active');
        if (!active) return null;
        return active.textContent === 'Все' ? null : active.textContent.replace('Тип: ', '');
    }

    // обработка клика на тег
    tagList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            tagList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            filterGallery(getActiveTag(), getActiveType());
        });
    });

    // обработка клика на тип
    filterList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
            filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            filterGallery(getActiveTag(), getActiveType());
        });
    });
}



// Инициализация тег-листа
function initTagList() {
    const tagList = document.getElementById('tagList');

    // Добавляем кнопку "Все"
    const allTagLi = document.createElement('li');
    allTagLi.textContent = 'Все';
    allTagLi.classList.add('active'); // по умолчанию активна
    allTagLi.addEventListener('click', () => {
        tagList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        allTagLi.classList.add('active');
        filterGallery(null, getActiveType());
    });
    tagList.appendChild(allTagLi);

    // Добавляем остальные теги
    tagsData.forEach(tag => {
        tagList.appendChild(createTagElement(tag));
    });
}

// Инициализация фильтров
function initFilters() {
    const filterList = document.getElementById('filterList');

    // Очищаем контейнер перед добавлением
    filterList.innerHTML = '';

    // Кнопка "Все"
    const allFilterLi = document.createElement('li');
    allFilterLi.textContent = 'Все';
    allFilterLi.classList.add('active');
    allFilterLi.addEventListener('click', () => {
        filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        allFilterLi.classList.add('active');
        filterGallery(getActiveTag(), null);
    });
    filterList.appendChild(allFilterLi);

    // Добавляем остальные фильтры
    filtersData.forEach(filter => {
        const li = createListItem(filter.name, filter.active);
        li.dataset.name = filter.name;
        li.addEventListener('click', () => {
            filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            filterGallery(getActiveTag(), filter.name);
        });
        filterList.appendChild(li);
    });
}


// Инициализация коллекций
function initCollections() {
    const collectionList = document.getElementById('collectionList');
    collectionsData.forEach(collection => {
        collectionList.appendChild(createListItem(collection.name));
    });
}

// Функция поиска тегов
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tagItems = document.querySelectorAll('#tagList li');

        tagItems.forEach(item => {
            const tagName = item.querySelector('span:first-child').textContent.toLowerCase();
            if (tagName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// API для управления тегами
const tagManager = {
    addTag: (name, count) => {
        tagsData.push({ name, count });
        refreshTagList();
    },

    removeTag: (name) => {
        const index = tagsData.findIndex(tag => tag.name === name);
        if (index !== -1) {
            tagsData.splice(index, 1);
            refreshTagList();
        }
    },

    updateTag: (oldName, newName, newCount) => {
        const tag = tagsData.find(tag => tag.name === oldName);
        if (tag) {
            tag.name = newName;
            tag.count = newCount;
            refreshTagList();
        }
    }
};

// Обновление списка тегов
function refreshTagList() {
    const tagList = document.getElementById('tagList');
    tagList.innerHTML = '';
    tagsData.forEach((tag, index) => {
        tagList.appendChild(createTagElement(tag, index === 0));
    });
}

// Получение активного тега/фильтра
function getActiveTag() {
    const active = document.querySelector('#tagList li.active');
    return active && active.textContent !== 'Все' ? active.textContent : null;
}

function getActiveType() {
    const active = document.querySelector('#filterList li.active');
    return active && active.textContent !== 'Все' ? active.textContent.replace('Тип: ', '') : null;
}


function webcloud(){
        // Обработчики для основных вкладок
        const menuButtons = document.querySelectorAll('.menu-btn');
        menuButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Удаляем активный класс у всех кнопок
                menuButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');

                // Здесь можно добавить логику загрузки контента для вкладки
                const tabName = this.dataset.tab;
                console.log('Активирована вкладка:', tabName);
            });
        });

        // Обработчики для переключателя режимов
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Удаляем активный класс у всех кнопок режима
                modeButtons.forEach(btn => btn.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');

                // Здесь можно добавить логику фильтрации контента
                const mode = this.dataset.mode;
                console.log('Выбран режим:', mode);
            });
        });
}
