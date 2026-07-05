// js/admin.js — админ-панель

const token = localStorage.getItem('token');

// Проверка авторизации
if (!token) {
  window.location.href = 'admin-login.html';
}

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
  loadAllData();
  
  const profile = JSON.parse(localStorage.getItem('userProfile'));
  if (profile) {
    document.getElementById('adminName').textContent = profile.name || 'Администратор';
  }
  
  setInterval(loadAllData, 10000);
});

function loadAllData() {
  loadStats();
  loadOrders();
}

// Загрузка статистики
async function loadStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const stats = await res.json();
      document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
      document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;
      document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
      document.getElementById('totalRevenue').textContent = (stats.totalRevenue || 0).toLocaleString() + ' ₽';
      return;
    }
  } catch (err) {}
  
  // Запасной вариант — localStorage
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'pending').length;
  document.getElementById('totalUsers').textContent = users.length;
  document.getElementById('totalRevenue').textContent = orders.reduce((s, o) => s + (o.total || 0), 0).toLocaleString() + ' ₽';
}

// Загрузка заказов
async function loadOrders() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      renderOrders(data.orders || []);
      return;
    }
  } catch (err) {}
  
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  renderOrders(orders);
}

function renderOrders(orders) {
  const tbody = document.getElementById('ordersTableBody');
  
  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-white-50 py-5">
          <i class="bi bi-inbox" style="font-size: 3rem;"></i>
          <p class="mt-3">Нет заказов</p>
        </td>
      </tr>`;
    return;
  }
  
  orders.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
  
  tbody.innerHTML = orders.map(order => {
    const orderId = order.orderId || order.id || '-';
    const customerName = order.customer_name || order.customerName || 'Без имени';
    const email = order.email || '-';
    const total = order.total || 0;
    const status = order.status || 'pending';
    const date = order.created_at || order.date || new Date().toISOString();
    const id = order.id || order.orderId;
    
    return `
      <tr>
        <td><strong>#${orderId}</strong></td>
        <td>${customerName}</td>
        <td>${email}</td>
        <td><strong>${total.toLocaleString()} ₽</strong></td>
        <td>
          <select class="status-select" onchange="updateStatus(${id}, this.value)">
            <option value="pending" ${status === 'pending' ? 'selected' : ''}>⏳ Ожидает</option>
            <option value="in-progress" ${status === 'in-progress' ? 'selected' : ''}>🔧 В работе</option>
            <option value="completed" ${status === 'completed' ? 'selected' : ''}>✅ Завершён</option>
          </select>
        </td>
        <td>${new Date(date).toLocaleDateString('ru-RU')}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${id})" title="Удалить">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Обновить статус
async function updateStatus(orderId, newStatus) {
  try {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
  } catch (err) {}
  
  loadAllData();
}

// Удалить заказ
async function deleteOrder(orderId) {
  if (!confirm('Удалить заказ #' + orderId + '?')) return;
  
  try {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (err) {}
  
  loadAllData();
}

// Экспорт заказов в CSV
function exportOrders() {
  fetch('/api/admin/orders/export', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Ошибка экспорта');
    return res.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toLocaleDateString('ru-RU')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  })
  .catch(err => {
    alert('Не удалось экспортировать заказы');
  });
}

// Выход
function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}