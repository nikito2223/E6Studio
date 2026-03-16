# UI parity map (Web -> Android Native)

Этот файл фиксирует, как web-интерфейс (index.html/style.css/js) перенесён 1-в-1 по структуре в нативный Android экран.

## Сопоставление блоков
- `functionbar` -> верхние кнопки `settingsBtn`, `incognitoBtn`
- `sidebar` -> drawer-панель (`DrawerLayout`) с `tagList`, `filterList`, `collectionList`
- `topbar` + `menu` -> заголовок + вкладки `Популярное/Новое/Избранное/История`
- `gallery` -> `RecyclerView` сетка карточек
- `card-active/viewer` -> отдельный `ViewerActivity`

## Функциональность
- загрузка e621 постов и пагинация
- поиск по тегам
- переключение вкладок (popular/new/favorites/history)
- фильтры по рейтингу (Safe/Questionable/Explicit)
- избранное и история через SharedPreferences
- инкогнито-режим (не пишет history)

## Оптимизации
- `ListAdapter + DiffUtil` в карточках
- фоновые сетевые запросы через single-thread executor
- простые локальные структуры без тяжёлых ORM/DB

- настройки: theme / max rating / blacklist / incognito

- поддержка видео (webm/mp4) во viewer
- скачивание фото/видео в Downloads
