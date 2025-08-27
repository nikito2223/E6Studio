import { initSettings } from './components/settings.js';
import {initPluginsMenu} from "./components/plugins.js";
import {initGalleryLoading} from "./components/gallery.js"

document.addEventListener('DOMContentLoaded', async () => {
  await initSettings();
  initGalleryLoading();
  initPluginsMenu();
});


