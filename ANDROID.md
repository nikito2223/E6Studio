# Android build (Capacitor)

В проект добавлена базовая конфигурация для Android через Capacitor.

## Что уже сделано
- Добавлен конфиг `capacitor.config.ts`.
- Добавлены npm-скрипты:
  - `npm run android:sync`
  - `npm run android:open`
  - `npm run android:build`

## Как собрать APK/AAB
1. Установите зависимости:
   ```bash
   npm install
   ```
2. Инициализируйте Android-проект:
   ```bash
   npx cap add android
   npm run android:sync
   ```
3. Откройте в Android Studio:
   ```bash
   npm run android:open
   ```
4. В Android Studio выполните Build APK/AAB.

## Что оптимизировано под мобильный UI
- Добавлен адаптивный `viewport`.
- Боковое меню стало выезжающим drawer на экранах до `900px`.
- Добавлены кнопка вызова drawer и затемнённый backdrop.
- Функциональная панель перенесена вниз в мобильном режиме.
- Сетка галереи и отступы адаптированы под смартфоны.
