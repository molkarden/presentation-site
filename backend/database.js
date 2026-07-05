const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

// Загружаем данные из файла или создаём новые
function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const data = JSON.parse(raw);
      
      // Добавляем админа если нет
      if (!data.users.find(u => u.role === 'admin')) {
        data.users.push({
          id: data.lastIds.user + 1,
          name: 'Администратор',
          email: 'admin@admin.com',
          password: '$2a$10$XQxBj0kFhLqHL7qHtQpQ0OZmPVqDqFqGJq0w5h8YJq0w5h8YJq0w5', // admin123
          phone: '',
          city: '',
          role: 'admin',
          created_at: new Date().toISOString()
        });
        data.lastIds.user++;
        saveData(data);
      }
      
      return data;
    }
  } catch (err) {
    console.error('Ошибка загрузки БД:', err.message);
  }
  
  // Начальная структура с админом
  return {
    users: [
      {
        id: 1,
        name: 'Администратор',
        email: 'admin@admin.com',
        password: '$2a$10$XQxBj0kFhLqHL7qHtQpQ0OZmPVqDqFqGJq0w5h8YJq0w5h8YJq0w5', // admin123
        phone: '',
        city: '',
        role: 'admin',
        created_at: new Date().toISOString()
      }
    ],
    orders: [],
    reviews: [],
    lastIds: { user: 1, order: 0, review: 0 }
  };
}

// Сохраняем данные в файл
function saveData(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Ошибка сохранения БД:', err.message);
  }
}

// База данных в памяти
let db = loadData();
console.log('✅ База данных загружена');
console.log(`   Пользователей: ${db.users.length}`);
console.log(`   Заказов: ${db.orders.length}`);
console.log(`   Отзывов: ${db.reviews.length}`);

// ===== ПОЛЬЗОВАТЕЛИ =====

function createUser(name, email, hashedPassword, phone = '', city = '', role = 'user') {
  db.lastIds.user++;
  const user = {
    id: db.lastIds.user,
    name,
    email,
    password: hashedPassword,
    phone,
    city,
    role,
    created_at: new Date().toISOString()
  };
  db.users.push(user);
  saveData(db);
  return user;
}

function findUserByEmail(email) {
  return db.users.find(u => u.email === email) || null;
}

function findUserById(id) {
  return db.users.find(u => u.id === id) || null;
}

function updateUser(id, data) {
  const index = db.users.findIndex(u => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...data };
    saveData(db);
    return db.users[index];
  }
  return null;
}

function getAllUsers() {
  return db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    city: u.city,
    created_at: u.created_at
  }));
}

// ===== ЗАКАЗЫ =====

function createOrder(data) {
  db.lastIds.order++;
  const order = {
    id: db.lastIds.order,
    orderId: 'ORD-' + String(db.lastIds.order).padStart(6, '0'),
    ...data,
    status: data.status || 'pending',
    created_at: new Date().toISOString()
  };
  db.orders.push(order);
  saveData(db);
  return order;
}

function getOrdersByUserId(userId) {
  return db.orders.filter(o => o.user_id === userId);
}

function getAllOrders() {
  return [...db.orders].reverse();
}

function updateOrderStatus(orderId, status) {
  const order = db.orders.find(o => o.id === parseInt(orderId));
  if (order) {
    order.status = status;
    saveData(db);
    return order;
  }
  return null;
}

function deleteOrder(orderId) {
  const index = db.orders.findIndex(o => o.id === parseInt(orderId));
  if (index !== -1) {
    db.orders.splice(index, 1);
    saveData(db);
    return true;
  }
  return false;
}

function getOrderStats() {
  return {
    totalOrders: db.orders.length,
    pendingOrders: db.orders.filter(o => o.status === 'pending').length,
    inProgressOrders: db.orders.filter(o => o.status === 'in-progress').length,
    completedOrders: db.orders.filter(o => o.status === 'completed').length,
    totalRevenue: db.orders.reduce((sum, o) => sum + (o.total || 0), 0)
  };
}

// ===== ОТЗЫВЫ =====

function createReview(data) {
  db.lastIds.review++;
  const review = {
    id: db.lastIds.review,
    ...data,
    created_at: new Date().toISOString()
  };
  db.reviews.push(review);
  saveData(db);
  return review;
}

function getAllReviews() {
  return [...db.reviews].reverse();
}

// ===== ЭКСПОРТ =====

module.exports = {
  // Пользователи
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  getAllUsers,
  
  // Заказы
  createOrder,
  getOrdersByUserId,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  
  // Отзывы
  createReview,
  getAllReviews
};