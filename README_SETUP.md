# JTest - Тренажёр для тестирования

## 🚀 Быстрый старт

### Установка на ПК
```bash
# 1. Установи зависимости
bun install

# 2. Сгенерируй типы и примени миграции БД
bun cf-typegen
bun db:generate
bun db:migrate

# 3. Запусти dev-сервер
bun dev
```

Открой браузер: **http://localhost:5173**

---

## 📱 Запуск на мобильном (Vercel)

### Вариант 1: Через GitHub (рекомендуется)
1. Зайди на [vercel.com](https://vercel.com)
2. Залогинься через GitHub
3. Нажми "Import Git Repository"
4. Выбери репо `K1ng-Tjk/JTest`
5. Нажми Deploy

Приложение будет доступно по ссылке за 2-3 минуты!

### Вариант 2: Через Netlify
1. Зайди на [netlify.com](https://netlify.com)
2. Нажми "Add new site"
3. Выбери "Import an existing project"
4. Подключи GitHub
5. Выбери репо
6. Deploy

---

## 📁 Структура проекта

```
JTest/
├── src/
│   ├── web/          # React frontend
│   │   ├── pages/    # Страницы (Home, Test, Training и т.д.)
│   │   ├── components/ # React компоненты
│   │   ├── lib/      # Утилиты (парсер тестов)
│   │   ├── store/    # Zustand хранилище
│   │   └── app.tsx   # Главный App компонент
│   └── api/          # Hono API на Cloudflare Workers
│       ├── index.ts  # API маршруты
│       └── database/ # Drizzle ORM схема БД
├── public/           # Статические файлы
├── package.json      # Зависимости
├── vite.config.ts    # Конфиг Vite
└── wrangler.json     # Конфиг Cloudflare Workers
```

---

## 🛠️ Стек технологий

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Hono на Cloudflare Workers
- **БД**: Drizzle ORM + Cloudflare D1
- **Компоненты**: shadcn/ui + Radix UI
- **Маршрутизация**: Wouter
- **Состояние**: Zustand
- **Иконки**: Lucide React

---

## 📝 Функционал

✅ Загрузка тестов (TXT, PDF, DOC)
✅ Автоматический парсинг вопросов
✅ Тестирование с таймером
✅ Статистика и результаты
✅ Сохранение прогресса
✅ PWA (работает оффлайн)

---

## 🎯 Командам для разработки

```bash
# Запуск дев-сервера
bun dev

# Сборка проекта
bun run build

# Проверка
bun run lint

# Работа с БД
bun run db:generate   # Сгенерировать миграции
bun run db:migrate    # Применить миграции
bun run db:studio     # Открыть UI студию БД

# Деплой на Cloudflare
bun run wrangler deploy
```

---

## 🤝 Помощь

Нужна помощь? Открой issue в репозитории или свяжись со мной!
