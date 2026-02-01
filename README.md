# KPD Platform

Платформа для управления KPI и оценки сотрудников.

## Технологии

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL

---

## Быстрый старт с Docker

### Требования
- Docker
- Docker Compose

### Запуск

1. Клонируйте репозиторий:
```bash
git clone <repo-url>
cd kpd-platform
```

2. Создайте файл `.env` (опционально):
```bash
cp .env.example .env
# Отредактируйте .env при необходимости
```

3. Запустите все сервисы:
```bash
# Сборка и запуск
docker-compose up -d --build

# Или через Makefile
make up-build
```

4. Откройте в браузере:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001/api

### Учётные данные по умолчанию

**Администратор:**
- Логин: `admin`
- Пароль: `admin123`

**Пользователи** (для входа через портал):
- Используйте username из базы данных
- Пароли такие же как username (например: `bibosinova` / `bibosinova`)

---

## Команды управления (Makefile)

```bash
# Запуск
make up              # Запустить контейнеры
make up-build        # Пересобрать и запустить

# Остановка
make down            # Остановить контейнеры
make clean           # Остановить и удалить volumes

# Логи
make logs            # Все логи
make logs-backend    # Логи backend
make logs-frontend   # Логи frontend
make logs-db         # Логи базы данных

# Shell доступ
make db-shell        # PostgreSQL shell
make backend-shell   # Backend container shell

# Пересборка
make rebuild-backend   # Пересобрать backend
make rebuild-frontend  # Пересобрать frontend
```

---

## Структура проекта

```
kpd-platform/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker/
│   └── init-db/
│       └── seed-data.sql
├── docker-compose.yml
├── Makefile
├── .env.example
└── README.md
```

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DB_USER` | Пользователь PostgreSQL | `kpd_user` |
| `DB_PASSWORD` | Пароль PostgreSQL | `kpd_password` |
| `DB_NAME` | Имя базы данных | `kpd_platform` |
| `JWT_SECRET` | Секрет для JWT токенов | `your-super-secret...` |
| `VITE_API_URL` | URL API для frontend | `http://localhost:3001/api` |

---

## Деплой на продакшн сервер

1. Скопируйте проект на сервер

2. Создайте `.env` файл с продакшн значениями:
```bash
DB_USER=kpd_user
DB_PASSWORD=<сильный-пароль>
DB_NAME=kpd_platform
JWT_SECRET=<случайный-секретный-ключ>
VITE_API_URL=https://api.yourdomain.com/api
```

3. Запустите:
```bash
docker-compose up -d --build
```

4. Для HTTPS настройте reverse proxy (nginx/traefik).

---

## Разработка (без Docker)

### Требования
- Node.js 20+
- PostgreSQL 15+

### Backend
```bash
cd backend
npm install
# Создайте .env файл с DATABASE_URL
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Откройте:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## API Endpoints

### Авторизация
- `POST /api/auth/login` - Вход админа
- `POST /api/user-auth/login` - Вход пользователя
- `GET /api/auth/me` - Текущий админ

### Пользователи
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создать пользователя
- `PUT /api/users/:id` - Обновить
- `DELETE /api/users/:id` - Удалить

### KPI
- `GET /api/kpis` - Список KPI
- `POST /api/kpis` - Создать KPI
- `POST /api/kpis/:id/blocks` - Добавить блок
- `POST /api/kpis/:id/blocks/:blockId/tasks` - Добавить показатель
- `POST /api/kpis/:id/submit` - Отправить на согласование

### Оценка
- `GET /api/evaluation/periods` - Периоды оценки
- `POST /api/evaluation/submit` - Отправить оценку
