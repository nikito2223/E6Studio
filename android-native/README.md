# E6 Studio Android (Native Kotlin)

Это нативное Android-приложение (Kotlin + XML), сделанное по структуре web UI (sidebar/topbar/gallery/viewer) с аналогичным функционалом.

## Требования
- Android Studio Iguana+ / Koala+
- JDK 17
- Android SDK 34
- minSdk 26 (Android 8.0)

## Запуск
1. Откройте папку `android-native` в Android Studio.
2. Выполните Gradle Sync.
3. Запустите модуль `app` на Android 8+.

## Что реализовано
- Интерфейс по модели web-приложения:
  - drawer sidebar (теги / фильтры / коллекции)
  - topbar + вкладки: Популярное / Новое / Избранное / История
  - галерея карточек
  - viewer экран
- Логика:
  - e621 API загрузка
  - поиск по тегам
  - фильтрация по рейтингу
  - избранное/история (SharedPreferences)
  - инкогнито режим
  - настройки: тема, max rating, blacklist тегов

## Оптимизация
- `ListAdapter + DiffUtil`
- Один background executor для сети
- Лёгкие локальные хранилища

- поддержка видео (webm/mp4) во viewer
- скачивание фото/видео в Downloads
