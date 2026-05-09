# Deployment Guide / Гайд деплоймента

## 🚀 Vercel Deployment (Рекомендуется)

### Шаги:
1. Зайди на https://vercel.com
2. Нажми "New Project"
3. "Import Git Repository"
4. Выбери `K1ng-Tjk/JTest`
5. В Environment Variables добавь (если нужно):
   - `VITE_API_URL` = твой API URL
6. Нажми "Deploy"

Готово! Приложение будет доступно по ссылке вида `jtest-xxx.vercel.app`

---

## 🌐 GitHub Pages

### Шаги:
1. В репо Settings → Pages
2. Выбери Branch: `main`, Folder: `/`
3. Сохрани
4. Приложение будет на: `https://K1ng-Tjk.github.io/JTest`

---

## ☁️ Netlify

### Шаги:
1. Зайди на https://netlify.com
2. "Add new site" → "Import an existing project"
3. Подключи GitHub
4. Выбери репо
5. Build command: `bun run build`
6. Publish directory: `dist`
7. Deploy

---

## 🔧 Cloudflare Workers (Backend)

```bash
# Деплой API
bun run wrangler deploy
```

---

## ⚙️ Environment Variables

Создай файл `.env` в корне (для локальной разработки):

```
VITE_API_URL=http://localhost:8787
VITE_APP_NAME=JTest
VITE_APP_URL=http://localhost:5173
```

---

## 📊 Мониторинг

После деплоя проверь:
- ✅ Приложение загружается
- ✅ Загрузка тестов работает
- ✅ Консоль браузера без ошибок
- ✅ Network табка показывает 200 статусы

