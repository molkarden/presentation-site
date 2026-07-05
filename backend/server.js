const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ========== НАСТРОЙКА ПОЧТЫ ==========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'molkarden7@gmail.com',
    pass: process.env.EMAIL_PASS || 'ghep phio hvgz hxlj'
  }
});

const EMAIL_FROM = `"Презентации на заказ" <${process.env.EMAIL_USER || 'molkarden7@gmail.com'}>`;
const ADMIN_EMAIL = process.env.EMAIL_USER || 'molkarden7@gmail.com';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// ========== ХРАНИЛИЩЕ КОДОВ ПОДТВЕРЖДЕНИЯ ==========
const verificationCodes = {};

// ========== ФУНКЦИЯ: Отправка пароля при регистрации ==========
async function sendWelcomeEmail(user, password) {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: user.email,
      subject: 'Добро пожаловать! Ваши данные для входа ✨',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f0ff;">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 20px; text-align: center;">
            <div style="font-size: 48px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 28px;">Добро пожаловать!</h1>
            <p style="color: #e9d5ff; margin: 10px 0 0;">Ваш аккаунт создан</p>
          </div>
          <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px;">
            <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);">
              <p style="font-size: 18px; color: #4c1d95;">Здравствуйте, <strong>${user.name}</strong>! 👋</p>
              <p style="color: #6b7280;">Ваш аккаунт успешно создан. Данные для входа:</p>
              <div style="background: #f8f7ff; border-radius: 10px; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0;"><strong>🔑 Пароль:</strong> <span style="background: #ede9fe; padding: 3px 10px; border-radius: 5px; font-family: monospace;">${password}</span></p>
              </div>
              <p style="color: #ef4444; font-size: 14px;">⚠️ Рекомендуем сменить пароль после первого входа.</p>
            </div>
            <div style="text-align: center;">
              <a href="${SITE_URL}/login.html" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 600;">Войти в личный кабинет</a>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 13px;">
              <p>© 2025 «Презентации на заказ»</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('✅ Приветственное письмо отправлено:', user.email);
  } catch (err) {
    console.error('❌ Ошибка отправки приветственного письма:', err.message);
  }
}

// Функция отправки уведомлений о новом заказе
async function sendOrderEmails(order) {
  try {
    // Письмо клиенту
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: order.email,
      subject: `Заказ #${order.orderId} принят в работу ✨`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background: #f5f0ff;">
          
          <!-- Шапка -->
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 20px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Спасибо за заказ!</h1>
            <p style="color: #e9d5ff; margin: 10px 0 0; font-size: 16px;">Ваша презентация уже в работе</p>
          </div>
          
          <!-- Основной блок -->
          <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px;">
            
            <!-- Приветствие -->
            <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);">
              <p style="font-size: 18px; color: #4c1d95; margin: 0 0 10px;">
                Здравствуйте, <strong>${order.customer_name}</strong>! 👋
              </p>
              <p style="color: #6b7280; line-height: 1.6; margin: 0;">
                Ваш заказ <strong style="color: #7c3aed;">#${order.orderId}</strong> успешно оформлен. 
                Мы уже приступили к работе над вашей презентацией.
              </p>
            </div>
            
            <!-- Детали заказа -->
            <div style="background: white; border-radius: 15px; padding: 0; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1); overflow: hidden;">
              <div style="background: #f8f7ff; padding: 20px 30px; border-bottom: 1px solid #ede9fe;">
                <h3 style="color: #4c1d95; margin: 0; font-size: 18px;">📋 Детали заказа</h3>
              </div>
              <div style="padding: 25px 30px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                      💰 Сумма
                    </td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #7c3aed; font-size: 20px; border-bottom: 1px solid #f3f4f6;">
                      ${(order.total || 0).toLocaleString()} ₽
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">
                      📝 Статус
                    </td>
                    <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #f3f4f6;">
                      <span style="background: #fef3c7; color: #d97706; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: 600;">В обработке</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280;">
                      📅 Дата
                    </td>
                    <td style="padding: 12px 0; text-align: right; color: #4c1d95; font-weight: 600;">
                      ${new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Что дальше -->
            <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);">
              <h3 style="color: #4c1d95; margin: 0 0 20px; font-size: 18px;">🚀 Что дальше?</h3>
              
              <table style="width: 100%;">
                <tr>
                  <td style="vertical-align: top; padding-bottom: 20px;">
                    <div style="width: 40px; height: 40px; background: #ede9fe; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; color: #7c3aed;">1</div>
                  </td>
                  <td style="padding-left: 15px; padding-bottom: 20px; color: #4c1d95;">
                    <strong>Связь с менеджером</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Мы свяжемся с вами в течение 24 часов для уточнения деталей</span>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; padding-bottom: 20px;">
                    <div style="width: 40px; height: 40px; background: #ede9fe; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; color: #7c3aed;">2</div>
                  </td>
                  <td style="padding-left: 15px; padding-bottom: 20px; color: #4c1d95;">
                    <strong>Создание макета</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Подготовим дизайн-макет и отправим вам на согласование</span>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top;">
                    <div style="width: 40px; height: 40px; background: #ede9fe; border-radius: 50%; text-align: center; line-height: 40px; font-weight: 700; color: #7c3aed;">3</div>
                  </td>
                  <td style="padding-left: 15px; color: #4c1d95;">
                    <strong>Готовый результат</strong><br>
                    <span style="color: #6b7280; font-size: 14px;">Вы получаете готовую презентацию, которая впечатлит вашу аудиторию</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Контакты -->
            <div style="background: white; border-radius: 15px; padding: 25px 30px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.1);">
              <h3 style="color: #4c1d95; margin: 0 0 15px; font-size: 18px;">📞 Есть вопросы?</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">
                    ✉️ <a href="mailto:${ADMIN_EMAIL}" style="color: #7c3aed; text-decoration: none;">${ADMIN_EMAIL}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">
                    📱 <span style="color: #4c1d95;">+7 (777) 777-77-77</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">
                    🕐 Пн-Пт: 9:00-18:00
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Кнопка -->
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${SITE_URL}/cabinet.html" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);">
                Перейти в личный кабинет
              </a>
            </div>
            
            <!-- Подвал -->
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 13px;">
              <p style="margin: 0 0 10px;">© 2025 «Презентации на заказ». Все права защищены.</p>
              <p style="margin: 0;">Вы получили это письмо, потому что оформили заказ на нашем сайте.</p>
            </div>
            
          </div>
        </body>
        </html>
      `
    });

    // Письмо админу
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `🛒 Новый заказ #${order.orderId} от ${order.customer_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; background: #1a1a2e; border-radius: 15px; padding: 30px; color: white;">
          <h2 style="color: #e0aaff; margin: 0 0 20px;">🛒 Новый заказ!</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 12px; color: #a78bfa;"><strong>ID</strong></td>
              <td style="padding: 12px;">${order.orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 12px; color: #a78bfa;"><strong>Клиент</strong></td>
              <td style="padding: 12px;">${order.customer_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 12px; color: #a78bfa;"><strong>Email</strong></td>
              <td style="padding: 12px;">${order.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 12px; color: #a78bfa;"><strong>Телефон</strong></td>
              <td style="padding: 12px;">${order.phone || '—'}</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
              <td style="padding: 12px; color: #a78bfa;"><strong>Сумма</strong></td>
              <td style="padding: 12px; color: #ffd6ff; font-size: 18px;"><strong>${(order.total || 0).toLocaleString()} ₽</strong></td>
            </tr>
            <tr>
              <td style="padding: 12px; color: #a78bfa;"><strong>Описание</strong></td>
              <td style="padding: 12px;">${order.description || '—'}</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 25px;">
            <a href="${SITE_URL}/admin.html" style="background: linear-gradient(135deg, #e0aaff, #ffd6ff); color: #2a2a2a; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: 600; display: inline-block;">
              Открыть админ-панель
            </a>
          </div>
        </div>
      `
    });

    console.log('✅ Письма отправлены');
  } catch (err) {
    console.error('❌ Ошибка отправки письма:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Раздача статических файлов (фронтенд)
app.use(express.static(path.join(__dirname, '..')));

// ========== АВТОРИЗАЦИЯ ==========

// Middleware проверки токена (для обычных пользователей)
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (token && token.startsWith('user_token_')) {
      const userId = token.replace('user_token_', '');
      req.userId = parseInt(userId);
      return next();
    }
    if (token && token.startsWith('admin_token_')) {
      req.userId = 1;
      return next();
    }
    return res.status(401).json({ error: 'Неверный токен' });
  }
}

// Middleware проверки админа
function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  
  if (token.startsWith('admin_token_')) {
    req.userId = 1;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(decoded.userId);
    
    if (user && user.role === 'admin') {
      req.userId = decoded.userId;
      return next();
    }
  } catch (err) {}
  
  return res.status(401).json({ error: 'Доступ запрещён. Только для администратора.' });
}

// Регистрация
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Имя, email и пароль обязательны' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть минимум 6 символов' });
    }
    
    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = db.createUser(name, email, hashedPassword, phone || '', city || '');
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Отправляем приветственное письмо с паролем
    sendWelcomeEmail(user, password).catch(err => console.error('Ошибка отправки письма:', err));
    
    res.status(201).json({
      message: 'Регистрация успешна! Пароль отправлен на почту.',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Вход
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Вход выполнен',
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, city: user.city, role: user.role
      }
    });
  } catch (err) {
    console.error('Ошибка входа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение профиля
app.get('/api/me', authMiddleware, (req, res) => {
  try {
    const user = db.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    const { password, ...userData } = user;
    res.json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновление профиля
app.put('/api/me', authMiddleware, (req, res) => {
  try {
    const { name, phone, city } = req.body;
    const updated = db.updateUser(req.userId, { name, phone: phone || '', city: city || '' });
    if (!updated) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ message: 'Профиль обновлён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== ЗАКАЗЫ ==========

// Создание заказа
app.post('/api/orders', (req, res) => {
  try {
    const { customerName, email, phone, city, description, items, total } = req.body;
    
    if (!customerName || !email || !items || !total) {
      return res.status(400).json({ error: 'Заполните обязательные поля' });
    }
    
    let userId = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        if (token.startsWith('user_token_')) userId = parseInt(token.replace('user_token_', ''));
        else if (token.startsWith('admin_token_')) userId = 1;
      }
    }
    
    const order = db.createOrder({
      user_id: userId,
      customer_name: customerName,
      email, phone: phone || '', city: city || '',
      description: description || '',
      items: typeof items === 'string' ? items : JSON.stringify(items),
      total
    });
    
    console.log('✅ Новый заказ:', order.orderId);
    
    // Отправляем email-уведомления
    sendOrderEmails(order).catch(err => console.error('Ошибка отправки писем:', err));
    
    res.status(201).json({ message: 'Заказ создан', orderId: order.orderId });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение заказов пользователя
app.get('/api/orders', authMiddleware, (req, res) => {
  try {
    const orders = db.getOrdersByUserId(req.userId);
    const parsedOrders = orders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));
    res.json({ orders: parsedOrders });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== ОТЗЫВЫ ==========

app.post('/api/reviews', authMiddleware, (req, res) => {
  try {
    const { rating, text } = req.body;
    if (!rating || !text) return res.status(400).json({ error: 'Оценка и текст обязательны' });
    
    const user = db.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    
    const review = db.createReview({ user_id: req.userId, author_name: user.name, rating, text });
    res.status(201).json({ message: 'Отзыв добавлен', review });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/reviews', (req, res) => {
  try {
    res.json({ reviews: db.getAllReviews() });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ========== АДМИН-ПАНЕЛЬ ==========

app.get('/api/admin/stats', adminMiddleware, (req, res) => {
  try {
    const stats = db.getOrderStats();
    const allUsers = db.getAllUsers();
    res.json({
      totalOrders: stats.totalOrders,
      pendingOrders: stats.pendingOrders,
      totalUsers: allUsers.filter(u => u.role !== 'admin').length,
      totalRevenue: stats.totalRevenue,
      inProgressOrders: stats.inProgressOrders,
      completedOrders: stats.completedOrders
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/orders', adminMiddleware, (req, res) => {
  try {
    const orders = db.getAllOrders();
    const parsedOrders = orders.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    }));
    res.json({ orders: parsedOrders });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/orders/:id', adminMiddleware, (req, res) => {
  try {
    const order = db.updateOrderStatus(parseInt(req.params.id), req.body.status);
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ message: 'Статус обновлён', order });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/orders/:id', adminMiddleware, (req, res) => {
  try {
    const deleted = db.deleteOrder(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Заказ не найден' });
    res.json({ message: 'Заказ удалён' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/users', adminMiddleware, (req, res) => {
  try {
    res.json({ users: db.getAllUsers() });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/orders/export', adminMiddleware, (req, res) => {
  try {
    const orders = db.getAllOrders();
    let csv = '\uFEFF';
    csv += 'ID;Клиент;Email;Сумма;Статус;Дата\n';
    
    orders.forEach((o, i) => {
      try {
        const id = (o && o.orderId) || (o && o.id) || `order_${i}`;
        const name = String((o && o.customer_name) || '').replace(/;/g, ',');
        const email = String((o && o.email) || '').replace(/;/g, ',');
        const total = (o && o.total) || 0;
        const status = (o && o.status) || 'pending';
        const date = (o && (o.created_at || o.date)) || '';
        csv += `${id};${name};${email};${total};${status};${date}\n`;
      } catch (e) {}
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка экспорта' });
  }
});

// ========== ПОДТВЕРЖДЕНИЕ ПОЧТЫ ==========

// Отправка кода (отвечаем мгновенно, письмо в фоне)
app.post('/api/send-code', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' });
  }
  
  // Генерируем 6-значный код
  const code = String(Math.floor(100000 + Math.random() * 900000));
  
  // Сохраняем код (действителен 10 минут)
  verificationCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 };
  
  // СРАЗУ отвечаем клиенту
  res.json({ message: 'Код отправлен', code: code });
  
  // Отправляем письмо в фоне
  transporter.sendMail({
    from: EMAIL_FROM,
    to: email,
    subject: 'Код подтверждения регистрации',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; border-radius: 15px; padding: 40px; color: white; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
        <h2 style="color: #e0aaff; margin-bottom: 10px;">Код подтверждения</h2>
        <p style="color: #a78bfa; margin-bottom: 30px;">Введите этот код на странице регистрации:</p>
        <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin-bottom: 30px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #ffd6ff;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Код действителен 10 минут</p>
      </div>
    `
  }).then(() => console.log('✅ Код отправлен на', email))
    .catch(err => console.error('❌ Ошибка отправки кода:', err.message));
});

// Проверка кода
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  const stored = verificationCodes[email];
  
  if (!stored) return res.status(400).json({ error: 'Код не найден. Запросите новый.' });
  if (Date.now() > stored.expires) { delete verificationCodes[email]; return res.status(400).json({ error: 'Код истёк. Запросите новый.' }); }
  if (stored.code !== code) return res.status(400).json({ error: 'Неверный код' });
  
  delete verificationCodes[email];
  res.json({ message: 'Код подтверждён' });
});

// ========== СЛУЖЕБНЫЕ ==========

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'json' });
});

app.get('/api/test-email', async (req, res) => {
  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: 'Тестовое письмо',
      text: 'Если вы это читаете — настройка работает! ✅'
    });
    res.json({ message: 'Тестовое письмо отправлено!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`👑 Админ-панель: http://localhost:${PORT}/admin-login.html`);
  console.log(`📧 Тест email: http://localhost:${PORT}/api/test-email`);
  console.log(`💡 Нажмите Ctrl+C для остановки`);
});