setTimeout(() => {
  document.querySelectorAll('.skeleton').forEach(el => {
    el.style.display = 'none';
  });

  const tags = ['ahegao', 'school', 'bondage', 'anal', 'cosplay', 'futanari', 'big breasts', 'blowjob'];
  const types = ['Изображение', 'Анимация', 'Видео'];

  for (let i = 0; i < 12; i++) {
    const card = document.createElement('div');
    card.className = 'card';

    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomTags = [];
    for (let j = 0; j < 3; j++) {
      randomTags.push(tags[Math.floor(Math.random() * tags.length)]);
    }

    card.innerHTML = `
      <div class="card-badge">${randomType}</div>
      <img class="card-img" src="https://via.placeholder.com/300x400/2e2e3e/888aa0?text=Hentai+${i + 3}" alt="Preview">
      <div class="card-content">
        <div class="card-title">Аниме сцена #${i + 3}</div>
        <div class="card-meta">
          <div class="card-rating">
            ${'<span class="star">★</span>'.repeat(Math.floor(Math.random() * 3) + 3)}
            <span>${(Math.random() * 2 + 3).toFixed(1)}</span>
          </div>
          <div>#${randomTags.join(' #')}</div>
        </div>
      </div>
      <div class="card-actions">
        <button title="В избранное">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">...</svg>
        </button>
        <button title="Скачать">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">...</svg>
        </button>
      </div>
    `;
    document.getElementById('gallery').appendChild(card);
  }
}, 1500);
