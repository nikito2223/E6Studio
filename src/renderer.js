import { initSettings } from './components/settings.js';
import {initPluginsMenu} from "./components/plugins.js";
import {initGalleryLoading, filterGallery } from "./components/gallery.js"
import { initMenuTabs } from './components/menu-tabs.js';
import { loadLanguage } from './components/localization/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguage();
  await initSettings();
  initGalleryLoading();
  initPluginsMenu();
  initMenuTabs(); 

  
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
});


