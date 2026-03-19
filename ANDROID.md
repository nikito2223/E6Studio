# Android build (Capacitor, Android 8+)

Проект подготовлен для упаковки JavaScript/HTML/CSS в Android-приложение через Capacitor.

## Что уже сделано
- Добавлен `capacitor.config.ts`.
- Добавлены скрипты для Android:
  - `npm run android:add`
  - `npm run android:android8`
  - `npm run android:sync`
  - `npm run android:open`
  - `npm run android:build`
- Добавлен скрипт `scripts/set-android8-sdk.js`, который фиксирует SDK-параметры:
  - `minSdkVersion = 26` (Android 8.0)
  - `targetSdkVersion = 34`
  - `compileSdkVersion = 34`

## Сборка под Android 8+
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Создайте Android-проект (один раз):
   ```bash
   npm run android:add
   ```
3. Примените Android 8+ настройки SDK:
   ```bash
   npm run android:android8
   ```
4. Синхронизируйте web-ресурсы:
   ```bash
   npm run android:sync
   ```
5. Откройте в Android Studio:
   ```bash
   npm run android:open
   ```
6. В Android Studio: Build APK/AAB.

## Важный момент
В web/android-среде нет Electron preload API. Поэтому добавлены безопасные fallback-ветки для:
- `window.appInfo`
- `window.pluginAPI`
- `window.download`
- `window.electronAPI`

Это позволяет запускать интерфейс как обычное Android WebView-приложение без падений.
