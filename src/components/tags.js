// Данные для тегов
export const tagsData = [
    { name: 'Minecraft', count: '42K' },
    { name: 'Stalker', count: '42K' },
    { name: 'Robot', count: '42K' },
    { name: '2', count: '42K' },
    { name: '3', count: '42K' },
];

// Данные для фильтров
export const filtersData = [
    { name: 'Рейтинг: Safe' },
    { name: 'Рейтинг: Questionable' },
    { name: 'Рейтинг: Explicit', },
    { name: 'Тип: Изображения' },
    { name: 'Тип: Анимации' },
    { name: 'Тип: Видео' }
];

// Данные для коллекций
export const collectionsData = [
    { name: 'Избранное ★' },
    { name: 'История просмотров' },
    { name: 'Черный список' },
    { name: 'Лучшее за месяц' }
];

export function initTag() {
    initTagList();
    initTagFilters();
    initFilters();
    initCollections();
    setupSearch();
    webcloud();
}

import { filterGallery } from './skeleton.js'; // путь к файлу с функцией фильтрации



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
