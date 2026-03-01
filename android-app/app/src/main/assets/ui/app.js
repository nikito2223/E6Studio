const state = { posts: [], favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')) };

function nativeCall(method, payload = '') {
  prompt(`bridge:${method}|${payload}`);
}

window.NativeBridge = {
  renderPosts(json) {
    const parsed = JSON.parse(json);
    state.posts = parsed;
    drawCards();
  },
  onNativeEvent(message) {
    console.log('Native:', message);
  }
};

function drawCards() {
  const rating = document.getElementById('ratingFilter').value;
  const root = document.getElementById('cards');
  root.innerHTML = '';

  state.posts
    .filter(p => rating === 'all' || p.rating === rating)
    .forEach(post => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <img src="${post.previewUrl}" alt="${post.title}">
        <div class="meta">
          <div>${post.title}</div>
          <div>❤ ${post.likes} · ⭐ ${post.favorites}</div>
          <button data-id="${post.id}">${state.favorites.has(post.id) ? 'Убрать из избранного' : 'В избранное'}</button>
        </div>`;
      card.querySelector('button').onclick = () => toggleFavorite(post.id);
      root.appendChild(card);
    });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem('favorites', JSON.stringify([...state.favorites]));
  drawCards();
}

document.getElementById('searchBtn').onclick = () => {
  const tag = document.getElementById('tagInput').value.trim();
  nativeCall('loadPosts', `${tag}|1`);
};

document.getElementById('buyBtn').onclick = () => nativeCall('buy', 'e6studio_pro');

document.querySelectorAll('.bottom-menu button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.bottom-menu button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
});

nativeCall('loadPosts', 'safe|1');
