import { initSettings } from './components/settings.js';
import { initThemeSwitcher } from './components/theme.js';
import { initSkeletonLoading } from './components/skeleton.js';
import { initViewModes } from './components/viewMode.js';
import { initIncognitoMode } from './components/incognito.js';
import { initContentModes } from './components/contentMode.js';
import {initUpdate} from "./components/updates.js";
import { checkForUpdates } from "./plugins/updater.js";

document.addEventListener('DOMContentLoaded', () => {
  initSettings();
  initThemeSwitcher();
  initSkeletonLoading();
  initViewModes();
  initIncognitoMode();
  initContentModes();
  initUpdate();
});

document.addEventListener('DOMContentLoaded', async () => {
  const infoApp = window.appInfo.get();

  const info = await checkForUpdates();
  if (!info) return;

  document.getElementById("app-version").textContent = infoApp.version;
  document.getElementById("app-version-new").textContent = info.version;
  document.getElementById("app-author").textContent = infoApp.author;
  document.getElementById("app-license").textContent = infoApp.license;

  const changelogElement = document.getElementById("changelog");
  changelogElement.innerHTML = "";

  info.changelog.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    changelogElement.appendChild(li);
  });
});

