// API
const E621_API = 'https://e621.net/posts.json';

const infoApp = window.appInfo.get();

const USER_AGENT = `${infoApp.name}/${infoApp.version} (by rufik on e621)`;

// Рейтинги
const ratingsMap = {
    s: 'Safe',
    q: 'Questionable',
    e: 'Explicit'
};

const ratingsOrder = ['s', 'q', 'e']; // порядок по возрастанию "безопасности"


// Состояние
export let originalTagList = null;
export let galleryData = [];
export let allTags = new Set();
export let currentTags = '';
export let currentPage = 1;

const PAGE_LIMIT = 40;

// Инициализация
export async function initGalleryLoading() {
    await loadE621Posts(); // подгружаем реальные посты
    initCensorshipToggle();
    initTag();
    initPagination();

}

// Загрузка постов
export async function loadE621Posts(tags = currentTags, page = currentPage, extraFilters = {}) {
    try {
        const res = await fetch(`${E621_API}?tags=${encodeURIComponent(tags)}&limit=${PAGE_LIMIT}&page=${page}`, {
            headers: { 'User-Agent': USER_AGENT }
        })
        const data = await res.json();

        currentTags = tags;
        currentPage = page;

        galleryData = data.posts.map(post => ({
            id: post.id,
            url: post.file.url,
            previewUrl: post.preview?.url || post.file.url,
            title: `E621 #${post.id}`,
            description: post.description || `Изображение с тегами: ${post.tags.general.join(', ')}`,
            type: ratingsMap[post.rating] || 'Unknown',
            fileType: post.file.ext || 'unknown',
            tags: post.tags.general,
            tagsByCategory: post.tags,
            likes: post.score.up,
            dislikes: post.score.down,
            views: post.fav_count || 0
        }));

        // score
        if (extraFilters.score) {
            extraFilters.score.forEach(f => {
                if (f.op === '>') galleryData = galleryData.filter(p => p.likes > f.value);
                else if (f.op === '>=') galleryData = galleryData.filter(p => p.likes >= f.value);
                else if (f.op === '<') galleryData = galleryData.filter(p => p.likes < f.value);
                else if (f.op === '<=') galleryData = galleryData.filter(p => p.likes <= f.value);
                else if (f.op === '=') galleryData = galleryData.filter(p => p.likes === f.value);
            });
        }
        
        // views
        if (extraFilters.views) {
            extraFilters.views.forEach(f => {
                if (f.op === '>') galleryData = galleryData.filter(p => p.views > f.value);
                else if (f.op === '>=') galleryData = galleryData.filter(p => p.views >= f.value);
                else if (f.op === '<') galleryData = galleryData.filter(p => p.views < f.value);
                else if (f.op === '<=') galleryData = galleryData.filter(p => p.views <= f.value);
                else if (f.op === '=') galleryData = galleryData.filter(p => p.views === f.value);
            });
        }



        allTags.clear();
        galleryData.forEach(post => post.tags.forEach(tag => allTags.add(tag)));

        initTagList();

        // Обновляем активный тег
        if (currentTags && currentTags.trim().length > 0) {
            const tagList = document.getElementById('tagList');
            if (tagList) {
                const match = Array.from(tagList.querySelectorAll('li')).find(li => {
                    return li.querySelector('span')?.textContent === currentTags;
                });
                if (match) {
                    tagList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
                    match.classList.add('active');
                }
            }
        }

        renderGallery();

        // ✅ фильтруем сразу после рендера, чтобы учесть maxRating и blacklist
        filterGallery();

        const totalPosts = data.total_posts || 1000;
        renderPageNumbers(totalPosts);

        // Сбрасываем фильтр "Все"
        const filterList = document.getElementById('filterList');
        if (filterList) {
            filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            const allFilter = filterList.querySelector('li'); // первая кнопка — "Все"
            if (allFilter) allFilter.classList.add('active');
        }

    } catch (err) {
        console.error('Ошибка загрузки E621:', err);
    }
}

// Загружаем комментарии для поста
async function loadComments(postId) {
    try {
        const res = await fetch(`https://e621.net/comments.json?search[post_id]=${postId}`, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            console.error("Ошибка HTTP при загрузке комментариев:", res.status, res.statusText);
            return [];
        }

        const data = await res.json();
        console.log("API ответ:", data);

        if (!data.comments) {
            console.warn("В ответе нет поля comments:", data);
            return [];
        }

        return data.comments;
    } catch (err) {
        console.error('Ошибка загрузки комментариев:', err);
        return [];
    }
}

// Проверка, добавлен ли пост в избранное
export function isFavorite(postId) {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favIds.includes(postId);
}

// Добавление / удаление из избранного
export function toggleFavorite(postId) {
    let favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favIds.includes(postId)) {
        favIds = favIds.filter(id => id !== postId); // удаляем
    } else {
        favIds.push(postId); // добавляем
    }
    localStorage.setItem('favorites', JSON.stringify(favIds));
}


// gallery.js
export function renderGallery(data = galleryData) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    const censorEnabled = document.getElementById('censor-toggle')?.checked || false;

    data.forEach((cardInfo) => {
        const card = document.createElement('div');
        card.className = 'card';

        let fileLabel = cardInfo.fileType || 'Unknown';
        if (fileLabel === 'jpeg') fileLabel = 'jpg';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileLabel)) fileLabel = 'Image';
        else if (['webm', 'mp4'].includes(fileLabel)) fileLabel = 'Video';

        let previewUrl = cardInfo.url;
        if (['webm', 'mp4', 'gif'].includes(cardInfo.fileType)) {
            previewUrl = cardInfo.previewUrl || '';
        }

        // Добавляем overlay цензуры
        const isCensored = censorEnabled && cardInfo.type === 'Explicit' || cardInfo.type === 'Questionable';
        card.classList.toggle('censored', isCensored);

        card.innerHTML = `
            <div class="card-badge">${cardInfo.type} / ${cardInfo.fileType}</div>
            <img class="card-img" src="${previewUrl}" alt="Preview">
            ${isCensored ? '<div class="censor-overlay">18+</div>' : ''}
            <div class="card-content">
                <div class="card-title">${cardInfo.title}</div>
            </div>
            <div class="card-meta">
                <div class="card-tags-wrapper" style="margin-top: auto;">
                    <div class="card-tags">
                        ${cardInfo.tags.slice(0, 3).map(tag => `<span class="tag" data-tag="${tag}">#${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
            <div class="card-actions">
                <button title="Скачать">⬇</button>
                <button title="Избранное" class="fav-btn">${isFavorite(cardInfo.id) ? '★' : '☆'}</button>
            </div>
        `;

        // Остальной код для избранного, скачивания, открытия карточки — без изменений
        const favBtn = card.querySelector('.fav-btn');
        if (favBtn) {
            favBtn.addEventListener("click", e => {
                e.stopPropagation();
                toggleFavorite(cardInfo.id);
                favBtn.textContent = isFavorite(cardInfo.id) ? '★' : '☆';
                const activeTab = document.querySelector('.menu-btn.active')?.dataset.tab;
                if (activeTab === 'favorites') {
                    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
                    const favPosts = galleryData.filter(post => favIds.includes(post.id));
                    renderGallery(favPosts);
                }
            });
        }

        card.addEventListener('click', e => {
            if (e.target.closest('button')) return;
            let history = JSON.parse(localStorage.getItem('history') || '[]');
            if (!history.includes(cardInfo.id)) {
                history.push(cardInfo.id);
                localStorage.setItem('history', JSON.stringify(history));
            }
            openCardView(cardInfo);
        });

        const downloadBtn = card.querySelector('button[title="Скачать"]');
        if (downloadBtn) {
            downloadBtn.addEventListener("click", e => {
                e.stopPropagation();
                const filename = `${cardInfo.title}.${cardInfo.fileType}`;
                window.download.downloadToAppFolder(cardInfo.url, filename);
            });
        }

        gallery.appendChild(card);
    });
}



const overlay = document.getElementById("docOverlay");
const docContent = document.getElementById("docContent");
const closeDoc = document.getElementById("closeDoc");

const urls = {
  privacy: "https://e621.net/static/privacy",
  terms: "https://e621.net/static/terms_of_service",
  help: "https://e621.net/help/faq"
};

document.querySelectorAll(".site-footer a").forEach(link => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const type = link.dataset.doc;
    if (!type) return;

    overlay.classList.add("active");
    docContent.innerHTML = "<h3>Загрузка...</h3>";

    try {
      const res = await fetch(urls[type]);
      const html = await res.text();

      // временный контейнер
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // достаём только полезный контент (у e621 это #content или .body)
      const main = doc.querySelector("#content") || doc.body;
      docContent.innerHTML = main.innerHTML;
    } catch (err) {
      docContent.innerHTML = `<p style="color:red">Ошибка загрузки: ${err}</p>`;
    }
  });
});

closeDoc.addEventListener("click", () => {
  overlay.classList.remove("active");
});


//================ Tags & Filters =================//
function initTag() {
    initTagList();
    initFilters();
    setupSearch();
}

// Инициализация тег-листа
function initTagList() {
    const tagList = document.getElementById('tagList');
    if (!tagList) return;
    tagList.innerHTML = '';

    // Кнопка "Все"
    const allTagLi = document.createElement('li');
    allTagLi.textContent = 'Все';
    allTagLi.classList.add('active');
    allTagLi.addEventListener('click', async () => {
        // Снимаем active со всех и ставим на "Все"
        tagList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        allTagLi.classList.add('active');

        // Очистим поисковую строку и загрузим дефолт
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        await loadE621Posts('', 1);
    });
    tagList.appendChild(allTagLi);

    // Динамические теги (максимум 25)
    Array.from(allTags).sort().slice(0, 25).forEach(tagName => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${tagName}</span>`;
        li.addEventListener('click', async () => {
            // помечаем active
            tagList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');

            // ставим в поисковую строку и выполняем поиск
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = tagName;
            await loadE621Posts(tagName, 1);
        });
        tagList.appendChild(li);
    });
}



// Инициализация фильтров
function initFilters() {
    const filterList = document.getElementById('filterList');
    if (!filterList) return;
    filterList.innerHTML = '';

    // Кнопка "Все"
    const allFilterLi = document.createElement('li');
    allFilterLi.textContent = 'Все';
    allFilterLi.classList.add('active');
    allFilterLi.addEventListener('click', () => {
        filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
        allFilterLi.classList.add('active');
        filterGallery();
    });
    filterList.appendChild(allFilterLi);

    Object.values(ratingsMap).forEach(type => {
        const li = document.createElement('li');
        li.textContent = type;
        li.addEventListener('click', () => {
            filterList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            filterGallery();
        });
        filterList.appendChild(li);
    });
}

// Парсим поисковый запрос
function parseSearchQuery(query) {
    const tokens = query.split(/\s+/);
    const tags = [];
    const extraFilters = {};

    tokens.forEach(token => {
        // score фильтры
        if (/^score([><]=?|=)\d+$/.test(token)) {
            const [, op, value] = token.match(/^score([><]=?|=)(\d+)$/);
            extraFilters.score = extraFilters.score || [];
            extraFilters.score.push({ op, value: Number(value) });
        }
        // views фильтры
        else if (/^views([><]=?|=)\d+$/.test(token)) {
            const [, op, value] = token.match(/^views([><]=?|=)(\d+)$/);
            extraFilters.views = extraFilters.views || [];
            extraFilters.views.push({ op, value: Number(value) });
        }
        // rating
        else if (/^rating:(\w+)$/.test(token)) {
            extraFilters.rating = token.split(':')[1];
        }
        // обычные теги
        else {
            tags.push(token);
        }
    });

    return { tags: tags.join(' '), extraFilters };
}



// Поиск тегов
// Поиск по тегам (по Enter)
// Изменяем setupSearch
function setupSearch() {
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('keydown', async e => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            if (searchTerm.length === 0) {
                await loadE621Posts('', 1);
                initTagList();
                return;
            }

            const { tags, extraFilters } = parseSearchQuery(searchInput.value);
            await loadE621Posts(tags, 1, extraFilters);
            initTagList();
        }
    });
}

// Инициализация тумблера цензуры
function initCensorshipToggle() {
  const censorToggle = document.getElementById('censor-toggle');
  if (!censorToggle) return;

  function applyCensorship(enabled) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    Array.from(gallery.children).forEach(card => {
      const badge = card.querySelector('.card-badge');
      if (!badge) return;

      // Если это Explicit и включена цензура
      if (badge.textContent.includes('Explicit')) {
        if (enabled) card.classList.add('censored');
        else card.classList.remove('censored');
      }
    });
  }

  // Инициализация при загрузке
  const saved = localStorage.getItem('censorExplicit') === 'true';
  censorToggle.checked = saved;
  applyCensorship(saved);

  // Переключение
  censorToggle.addEventListener('change', () => {
    const enabled = censorToggle.checked;
    localStorage.setItem('censorExplicit', enabled);
    applyCensorship(enabled);
  });

  // Чтобы фильтр сработал при подгрузке новых постов
  window.filterGallery = ((orig) => (...args) => {
    orig(...args);
    applyCensorship(censorToggle.checked);
  })(window.filterGallery);
}


// Фильтрация галереи
// В фильтре галереи добавляем проверку на цензуру
export function filterGallery() {
    const activeLi = document.querySelector('#tagList li.active');
    const blacklist = new Set(JSON.parse(localStorage.getItem('blacklistTags') || '[]'));
    let selectedTag = null;
    if (activeLi) {
        const span = activeLi.querySelector('span');
        selectedTag = span ? span.textContent.trim() : activeLi.textContent.trim();
        if (selectedTag === 'Все') selectedTag = null;
    }

    const selectedTypeRaw = document.querySelector('#filterList li.active')?.textContent || null;
    const selectedType = (selectedTypeRaw === 'Все' ? null : selectedTypeRaw);

    const maxRatingSelect = document.getElementById('maxRatingSelect');
    const maxRating = maxRatingSelect?.value || 'e'; // по умолчанию Explicit

    const censorEnabled = document.getElementById('censor-toggle')?.checked || false;

    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    galleryData.forEach(cardInfo => {
        const cardElem = Array.from(gallery.children).find(c =>
            c.querySelector('.card-title')?.textContent === cardInfo.title
        );
    
        const matchesTag = selectedTag ? cardInfo.tags.includes(selectedTag) : true;
        const matchesType = selectedType ? cardInfo.type === selectedType : true;
        let matchesRating = true;
        if (maxRating !== 'all') {
            const cardRating = Object.keys(ratingsMap).find(k => ratingsMap[k] === cardInfo.type);
            const maxIndex = ratingsOrder.indexOf(maxRating);
            const cardIndex = ratingsOrder.indexOf(cardRating);
            matchesRating = cardIndex <= maxIndex;
        }
    
        const matchesBlacklist = !cardInfo.tags.some(tag => blacklist.has(tag));

        // ✅ новая проверка цензуры
        const matchesCensor = censorEnabled && cardInfo.type === 'Explicit' ? false : true;
    
        if (cardElem) cardElem.style.display = matchesTag && matchesType && matchesRating && matchesBlacklist && matchesCensor ? 'block' : 'none';
    });

    window.filterGallery = filterGallery;
}





function initPagination(totalPosts = 1000) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    pagination.innerHTML = `
        <button id="firstPage">⏮ Первая</button>
        <button id="prevPage">⬅ Назад</button>
        <span id="pageNumbers"></span>
        <button id="nextPage">Вперёд ➡</button>
        <button id="lastPage" hidden>⏭ Последняя</button>
    `;

    document.getElementById('firstPage').addEventListener('click', async () => {
        if (currentPage > 1) await loadE621Posts(currentTags, 1);
    });

    document.getElementById('prevPage').addEventListener('click', async () => {
        if (currentPage > 1) await loadE621Posts(currentTags, currentPage - 1);
    });

    document.getElementById('nextPage').addEventListener('click', async () => {
        await loadE621Posts(currentTags, currentPage + 1);
    });

    document.getElementById('lastPage').addEventListener('click', async () => {
        const totalPages = Math.ceil(totalPosts / PAGE_LIMIT);
        if (currentPage < totalPages) await loadE621Posts(currentTags, totalPages);
    });

    renderPageNumbers(totalPosts);
}

function renderPageNumbers(totalPosts) {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;

    const totalPages = Math.ceil(totalPosts / PAGE_LIMIT);
    pageNumbers.innerHTML = '';

    const visible = 3; // сколько кнопок до и после текущей

    let start = Math.max(1, currentPage - visible);
    let end = Math.min(totalPages, currentPage + visible);

    // Первая страница
    if (start > 1) {
        addPageButton(1);
        if (start > 2) pageNumbers.appendChild(createDots());
    }

    for (let i = start; i <= end; i++) {
        addPageButton(i);
    }

    // Последняя страница
    if (end < totalPages) {
        if (end < totalPages - 1) pageNumbers.appendChild(createDots());
        addPageButton(totalPages);
    }

    function addPageButton(i) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', async () => await loadE621Posts(currentTags, i));
        pageNumbers.appendChild(btn);
    }

    function createDots() {
        const span = document.createElement('span');
        span.textContent = '…';
        return span;
    }

    updatePaginationButtons(totalPages);
}


function updatePaginationButtons(totalPages) {
    document.getElementById('prevPage').disabled = currentPage <= 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

//================ Card View =================//
async function openCardView(cardData) {
    const gallery = document.querySelector('.gallery-wrapper');
    if (gallery) gallery.classList.add('hidden');

    const cardView = document.querySelector('.card-active');
    if (!cardView) return;

    // Картинка и описание
    cardView.querySelector('.viewer-image').src = cardData.url;
    cardView.querySelector('.viewer-image').alt = cardData.title;
    cardView.querySelector('.image-description').textContent = cardData.description;

    // Теги
    const tagsContainer = cardView.querySelector('.image-tags');
    tagsContainer.innerHTML = '';
    
    // Создаём wrapper для категорий тегов
    const wrapper = document.createElement('div');
    wrapper.className = 'image-tags-wrapper';
    
    // Добавляем категории тегов (если есть)
    ['general','character','copyright','species','artist','invalid','lore','meta'].forEach(cat => {
        const tags = cardData.tagsByCategory?.[cat] || [];
        if (tags.length === 0) return;
    
        const catTitle = document.createElement('div');
        catTitle.className = 'tag-category';
        catTitle.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    
        const tagList = document.createElement('div');
        tagList.className = 'tag-list';
    
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.dataset.tag = tag;
            span.textContent = `#${tag}`;
    
            // обработчик клика
            span.addEventListener('click', async () => {
                closeCardView(); // закрываем карточку
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = tag;
                await loadE621Posts(tag, 1);
                initTagList();
            });
    
            tagList.appendChild(span);
        });
    
        wrapper.appendChild(catTitle);
        wrapper.appendChild(tagList);
    });
    
    tagsContainer.appendChild(wrapper);


    // Лайки / дизлайки
    cardView.querySelector('.like-btn span').textContent = cardData.likes;
    cardView.querySelector('.dislike-btn span').textContent = cardData.dislikes;

    // Просмотры
    cardView.querySelector('.view-count span').textContent = cardData.views;

    // Показ окна
    cardView.classList.remove('hidden');

    // Закрытие
    const closeBtn = cardView.querySelector('.card-close');
    if (closeBtn) closeBtn.onclick = closeCardView;
}



function closeCardView() {
    const cardView = document.querySelector('.card-active');
    if (cardView) cardView.classList.add('hidden');

    const gallery = document.querySelector('.gallery-wrapper');
    if (gallery) gallery.classList.remove('hidden');
}
