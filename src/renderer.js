import { initSettings } from './components/settings.js';
import { initPluginsMenu } from './components/plugins.js';
import { initGalleryLoading, filterGallery } from './components/gallery.js';
import { initAndroidUI } from './components/android.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initSettings();
  await initGalleryLoading();
  await initPluginsMenu();
  initAndroidUI();

  const maxRatingSelect = document.getElementById('maxRatingSelect');
  if (maxRatingSelect) {
    maxRatingSelect.addEventListener('change', () => {
      filterGallery();
    });
  }

  let blacklistTags = new Set(JSON.parse(localStorage.getItem('blacklistTags')) || []);
  function saveBlacklist() {
    localStorage.setItem('blacklistTags', JSON.stringify(Array.from(blacklistTags)));
  }

  window.saveBlacklist = saveBlacklist;
  window.blacklistTags = blacklistTags;
});
