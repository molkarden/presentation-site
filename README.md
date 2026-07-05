# 🎨 Презентации на заказ

Полноценный веб-сайт для заказа профессиональных презентаций с личным кабинетом, корзиной и админ-панелью.

## 🌐 Ссылки

- **Сайт:** [presentation-site-production.up.railway.app](https://presentation-site-production.up.railway.app)
- **Админ-панель:** [presentation-site-production.up.railway.app/admin-login.html](https://presentation-site-production.up.railway.app/admin-login.html)

## ✨ Функционал

### Для клиентов:
- 📝 Регистрация и вход в личный кабинет
- 🛒 Каталог услуг и корзина
- 📧 Подтверждение email через код
- 💳 Оформление заказа с выбором способа оплаты
- 📋 История заказов
- ⭐ Отзывы и рейтинг

### Для администратора:
- 📊 Статистика заказов и выручки
- 📋 Управление заказами (изменение статуса, удаление)
- 👥 Просмотр пользователей
- 📥 Экспорт заказов в CSV/Excel
- 📧 Email-уведомления о новых заказах

## 🛠 Технологии

| Фронтенд | Бэкенд | Деплой |
|----------|--------|--------|
| HTML5, CSS3, Bootstrap 5 | Node.js, Express.js | Railway (PaaS) |
| JavaScript (ES6+) | REST API (15+ эндпоинтов) | GitHub Actions |
| Адаптивная верстка | JWT-аутентификация | |
| CSS-анимации | Bcrypt, Nodemailer | |

## 🚀 Запуск локально

```bash
# Клонировать репозиторий
git clone https://github.com/molkarden/presentation-site.git

# Перейти в папку
cd presentation-site/backend

# Установить зависимости
npm install

# Запустить сервер
npm start
