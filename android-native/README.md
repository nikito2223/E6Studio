# E6 Studio Android (Native Kotlin)

Это **полноценный нативный Android-проект** (не WebView, не Electron, не HTML/JS runtime).

## Требования
- Android Studio Iguana+ / Koala+
- JDK 17
- Android SDK 34
- minSdk 26 (Android 8.0)

## Запуск
1. Откройте папку `android-native` в Android Studio.
2. Дождитесь Sync Gradle.
3. Запустите `app` на устройстве/эмуляторе Android 8+.

## Что реализовано
- Kotlin + AndroidX
- Экран ленты постов e621 (поиск по тегам)
- Пагинация (пред/след страница)
- Сетка карточек с превью, рейтингом, score, тегами
- Сетевой слой на OkHttp
- Загрузка изображений через Coil

## Архитектура
- `ui/MainActivity.kt` — основной экран
- `ui/PostAdapter.kt` — RecyclerView адаптер
- `network/E621Client.kt` — клиент e621 API
- `model/PostItem.kt` — модель карточки
