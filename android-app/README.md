# E6 Studio Mobile (Android, без WebView)

Этот модуль добавляет нативное Android-приложение на Kotlin, где HTML/CSS/JS интерфейс рендерится через **GeckoView** (движок Firefox), а не через WebView.

## Что реализовано
- Нативный Android-проект для Android Studio (Gradle Kotlin DSL).
- UI в `app/src/main/assets/ui` (HTML/CSS/JS) с адаптацией под телефон/планшет и portrait/landscape.
- Мост JS ↔ Kotlin через `prompt("bridge:...")` в GeckoView.
- Загрузка постов из API e621 через Retrofit/Moshi.
- Карточки, фильтры по рейтингу, избранное, нижнее меню.
- Подключён Billing Client для in-app покупок.

## Запуск
1. Откройте папку `android-app` в Android Studio.
2. Выполните Gradle Sync.
3. Запустите приложение на устройстве/эмуляторе Android 8.0+.

> Для реальных покупок добавьте актуальные Product IDs и настройте Google Play Console.
