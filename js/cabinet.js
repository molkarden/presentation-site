// js/cabinet.js — личный кабинет

const successToast = new bootstrap.Toast(document.getElementById('successToast'));

document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  loadOrders();
  loadCart();
  setupForm();
  setupButtons();
});

// Загрузка данных пользователя
function loadUserData() {
  const token = localStorage.getItem('token');
  
  if (token) {
    fetch('/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        fillUserData(data.user);
      }
    })
    .catch(() => loadLocalProfile());
  } else {
    loadLocalProfile();
  }
}

function loadLocalProfile() {
  const profile = JSON.parse(localStorage.getItem('userProfile'));
  if (profile) {
    fillUserData({
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      phone: profile.phone
    });
    document.getElementById('firstName').value = profile.firstName || '';
    document.getElementById('lastName').value = profile.lastName || '';
  }
}

function fillUserData(user) {
  const nameParts = (user.name || 'Пользователь').split(' ');
  document.getElementById('userName').textContent = user.name || 'Пользователь';
  document.getElementById('userEmail').textContent = user.email || '';
  document.getElementById('userAvatar').textContent = 
    (nameParts[0]?.[0] || '👤').toUpperCase();
  document.getElementById('email').value = user.email || '';
  document.getElementById('phone').value = user.phone || '';
}

// Загрузка заказов
function loadOrders() {
  const token = localStorage.getItem('token');
  
  if (token) {
    fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.orders) renderOrders(data.orders);
    })
    .catch(() => loadLocalOrders());
  } else {
    loadLocalOrders();
  }
}

function loadLocalOrders() {
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  renderOrders(orders);
}

function renderOrders(orders) {
  const container = document.getElementById('ordersList');
  document.getElementById('totalOrders').textContent = orders.length;
  
  if (orders.length === 0) {
    container.innerHTML = `<p class="text-center text-white-50 py-4">Нет заказов</p>`;
    return;
  }
  
  container.innerHTML = orders.map(order => `
    <div class="order-item">
      <div class="d-flex justify-content-between">
        <h6>${order.customer_name || order.customerName || 'Заказ'} #${order.orderId || order.id}</h6>
        <span class="status-badge status-${order.status === 'completed' ? 'completed' : 'pending'}">${order.status}</span>
      </div>
      <p class="text-white-50">${order.description || ''}</p>
      <small class="text-white-50">${new Date(order.created_at || order.date).toLocaleDateString('ru-RU')}</small>
      <small class="text-white-50 float-end">${order.total?.toLocaleString()} ₽</small>
    </div>
  `).join('');
}

// Корзина
function addToCart(name, description, price, type) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Удаляем старую основную услугу
  if (type === 'main') {
    const filtered = cart.filter(item => item.type !== 'main');
    filtered.push({ name, description, price, quantity: 1, type: 'main' });
    localStorage.setItem('cart', JSON.stringify(filtered));
  } else {
    const existing = cart.findIndex(item => item.name === name);
    if (existing !== -1) {
      cart[existing].quantity++;
    } else {
      cart.push({ name, description, price, quantity: 1, type: 'addon' });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  
  loadCart();
  showToast(`${name} добавлен в корзину`);
  new bootstrap.Tab(document.querySelector('a[href="#cart"]')).show();
}

function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const container = document.getElementById('cartItems');
  
  if (cart.length === 0) {
    container.innerHTML = `<p class="text-center text-white-50 py-4">Корзина пуста</p>`;
    document.getElementById('cartTotal').textContent = '0 ₽';
    return;
  }
  
  let total = 0;
  container.innerHTML = cart.map((item, i) => {
    total += item.price * item.quantity;
    return `
      <div class="order-item d-flex justify-content-between align-items-center">
        <div>
          <h6>${item.name}</h6>
          <small class="text-white-50">${item.price} ₽ × ${item.quantity}</small>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart(${i})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `;
  }).join('');
  
  document.getElementById('cartTotal').textContent = `${total.toLocaleString()} ₽`;
}

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

// Форма настроек
function setupForm() {
  document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const profile = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value
    };
    localStorage.setItem('userProfile', JSON.stringify(profile));
    fillUserData({
      name: `${profile.firstName} ${profile.lastName}`,
      email: profile.email,
      phone: profile.phone
    });
    showToast('Профиль сохранён');
  });
}

// Кнопки
function setupButtons() {
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    new bootstrap.Tab(document.querySelector('a[href="#settings"]')).show();
  });
  
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Выйти?')) {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    }
  });
}

function showToast(msg) {
  document.querySelector('.toast-body').textContent = msg;
  successToast.show();
}