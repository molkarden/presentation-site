// js/order.js — логика страницы заказа

const successToast = new bootstrap.Toast(document.getElementById('successToast'));
let currentOrder = { items: [], total: 0, customerInfo: {} };

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  loadCart();
  updateSelectedService();
  setupEventListeners();
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
        document.getElementById('name').value = data.user.name || '';
        document.getElementById('email').value = data.user.email || '';
        document.getElementById('phone').value = data.user.phone || '';
      }
    })
    .catch(() => loadLocalProfile());
  } else {
    loadLocalProfile();
  }
}

function loadLocalProfile() {
  const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
  if (savedProfile) {
    document.getElementById('name').value = `${savedProfile.firstName || ''} ${savedProfile.lastName || ''}`.trim();
    document.getElementById('email').value = savedProfile.email || '';
    document.getElementById('phone').value = savedProfile.phone || '';
  }
}

// Загрузка корзины
function loadCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const container = document.getElementById('cartItems');
  const totalElem = document.getElementById('cartTotal');
  
  container.innerHTML = '';
  currentOrder.items = [];
  currentOrder.total = 0;
  
  if (cart.length === 0) {
    container.innerHTML = '<p class="text-center text-white-50">Корзина пуста</p>';
    totalElem.textContent = 'Итого: 0 ₽';
    document.getElementById('payAmount').textContent = '0 ₽';
    return;
  }
  
  cart.forEach(item => {
    const itemTotal = item.price * (item.quantity || 1);
    currentOrder.items.push(item);
    currentOrder.total += itemTotal;
    
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <div class="cart-item-name">${item.name}</div>
        <small class="text-white-50">${item.description || ''}</small>
      </div>
      <div class="cart-item-price">${itemTotal.toLocaleString()} ₽</div>
    `;
    container.appendChild(div);
  });
  
  totalElem.textContent = `Итого: ${currentOrder.total.toLocaleString()} ₽`;
  document.getElementById('payAmount').textContent = `${currentOrder.total.toLocaleString()} ₽`;
}

// Обновление выбранной услуги
function updateSelectedService() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const mainService = cart.find(item => item.type === 'main');
  
  if (mainService) {
    document.getElementById('serviceName').textContent = mainService.name;
    document.getElementById('serviceDescription').textContent = mainService.description || '';
    document.getElementById('servicePrice').textContent = `${mainService.price.toLocaleString()} ₽`;
  }
}

// Валидация формы
function validateForm() {
  let isValid = true;
  const name = document.getElementById('name');
  const email = document.getElementById('email');
  const description = document.getElementById('description');

  if (name.value.trim().length < 2) {
    name.classList.add('is-invalid');
    isValid = false;
  } else {
    name.classList.remove('is-invalid');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.classList.add('is-invalid');
    isValid = false;
  } else {
    email.classList.remove('is-invalid');
  }

  if (description.value.trim().length < 10) {
    description.classList.add('is-invalid');
    isValid = false;
  } else {
    description.classList.remove('is-invalid');
  }

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    showToast('Добавьте услуги в корзину');
    isValid = false;
  }

  return isValid;
}

// Отправка заказа
async function submitOrder(formData, payNow) {
  const orderData = {
    customerName: formData.name,
    email: formData.email,
    phone: formData.phone || '',
    city: formData.city || '',
    description: formData.description,
    items: currentOrder.items,
    total: currentOrder.total,
    payNow: payNow
  };

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      const data = await res.json();
      // Сохраняем локально для админ-панели
      saveOrderLocally(orderData, payNow);
      return { success: true, orderId: data.orderId };
    }
    return saveOrderLocally(orderData, payNow);
  } catch (err) {
    return saveOrderLocally(orderData, payNow);
  }
}

function saveOrderLocally(orderData, payNow) {
  const order = {
    id: Date.now(),
    orderId: 'ORD-' + Date.now().toString().slice(-8),
    customer_name: orderData.customerName,
    email: orderData.email,
    phone: orderData.phone || '',
    city: orderData.city || '',
    description: orderData.description,
    items: orderData.items,
    total: orderData.total,
    status: payNow ? 'paid' : 'pending',
    date: new Date().toISOString()
  };
  
  // Сохраняем с ключом 'orders'
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
  
  console.log('✅ Заказ сохранён локально:', order.orderId);
  console.log('📊 Всего заказов в localStorage:', orders.length);
  
  return { success: true, orderId: order.orderId, local: true };
}

// Очистка
function clearAll() {
  document.getElementById('orderForm').reset();
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.addon-service').forEach(btn => {
    btn.classList.remove('btn-custom');
    btn.classList.add('btn-outline-custom');
  });
  localStorage.removeItem('cart');
  loadCart();
  updateSelectedService();
  document.getElementById('cardPaymentBlock').style.display = 'none';
  document.getElementById('payLater').checked = true;
}

function showToast(message) {
  document.querySelector('.toast-body').textContent = message;
  successToast.show();
}

// Симуляция оплаты картой
function processCardPayment() {
  const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
  const cardExpiry = document.getElementById('cardExpiry').value;
  const cardCvc = document.getElementById('cardCvc').value;
  const statusDiv = document.getElementById('paymentStatus');

  if (!cardNumber || cardNumber.length < 16) {
    statusDiv.innerHTML = '<span class="text-danger">Введите корректный номер карты</span>';
    statusDiv.style.display = 'block';
    return false;
  }
  if (!cardExpiry || !cardExpiry.includes('/')) {
    statusDiv.innerHTML = '<span class="text-danger">Введите срок действия (ММ/ГГ)</span>';
    statusDiv.style.display = 'block';
    return false;
  }
  if (!cardCvc || cardCvc.length < 3) {
    statusDiv.innerHTML = '<span class="text-danger">Введите CVC/CVV код</span>';
    statusDiv.style.display = 'block';
    return false;
  }

  statusDiv.innerHTML = `
    <div class="spinner-border text-light mb-2" role="status"></div>
    <p>Обрабатываем платёж...</p>
  `;
  statusDiv.style.display = 'block';
  
  return true;
}

// Форматирование номера карты
function formatCardNumber(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.substring(0, 16);
  value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
  input.value = value;
}

// Форматирование срока действия
function formatExpiry(input) {
  let value = input.value.replace(/\D/g, '');
  value = value.substring(0, 4);
  if (value.length > 2) {
    value = value.substring(0, 2) + '/' + value.substring(2);
  }
  input.value = value;
}

// Настройка обработчиков
function setupEventListeners() {
  // Дополнительные услуги
  document.querySelectorAll('.addon-service').forEach(button => {
    button.addEventListener('click', function() {
      const serviceName = this.getAttribute('data-service');
      const servicePrice = parseInt(this.getAttribute('data-price'));
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      
      const existingIndex = cart.findIndex(item => item.name === serviceName);
      
      if (existingIndex !== -1) {
        cart.splice(existingIndex, 1);
        this.classList.remove('btn-custom');
        this.classList.add('btn-outline-custom');
      } else {
        cart.push({
          name: serviceName,
          description: 'Дополнительная услуга',
          price: servicePrice,
          quantity: 1,
          type: 'addon'
        });
        this.classList.remove('btn-outline-custom');
        this.classList.add('btn-custom');
      }
      
      localStorage.setItem('cart', JSON.stringify(cart));
      loadCart();
    });
  });

  // Показ/скрытие блока оплаты картой
  document.getElementById('payNow').addEventListener('change', function() {
    document.getElementById('cardPaymentBlock').style.display = this.checked ? 'block' : 'none';
  });
  
  document.getElementById('payLater').addEventListener('change', function() {
    document.getElementById('cardPaymentBlock').style.display = this.checked ? 'none' : 'block';
  });

  // Форматирование полей карты
  document.getElementById('cardNumber').addEventListener('input', function() {
    formatCardNumber(this);
  });
  
  document.getElementById('cardExpiry').addEventListener('input', function() {
    formatExpiry(this);
  });
  
  document.getElementById('cardCvc').addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '').substring(0, 3);
  });

  // Кнопка оплаты картой
  document.getElementById('payWithCardBtn').addEventListener('click', function() {
    if (currentOrder.total <= 0) {
      showToast('Добавьте услуги в корзину');
      return;
    }
    
    if (processCardPayment()) {
      setTimeout(() => {
        const formData = {
          name: document.getElementById('name').value,
          email: document.getElementById('email').value,
          phone: document.getElementById('phone').value,
          city: document.getElementById('city').value,
          description: document.getElementById('description').value
        };
        
        submitOrder(formData, true).then(result => {
          if (result.success) {
            const statusDiv = document.getElementById('paymentStatus');
            statusDiv.innerHTML = `
              <i class="bi bi-check-circle-fill text-success fs-1"></i>
              <p class="mt-2">Оплата прошла успешно!</p>
              <p class="small-muted">Заказ #${result.orderId}</p>
            `;
            
            setTimeout(() => {
              clearAll();
              document.getElementById('paymentStatus').style.display = 'none';
              showToast('Заказ оформлен и оплачен!');
            }, 2000);
          }
        });
      }, 2000);
    }
  });

  // Отправка формы (без оплаты)
  document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const payNow = document.getElementById('payNow').checked;
    
    if (payNow) {
      showToast('Нажмите кнопку "Оплатить" для оплаты картой');
      return;
    }
    
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      city: document.getElementById('city').value.trim(),
      description: document.getElementById('description').value.trim()
    };
    
    const result = await submitOrder(formData, false);
    
    if (result.success) {
      clearAll();
      showToast(`Заказ #${result.orderId} оформлен! Счёт отправлен на ${formData.email}.`);
      console.log('✅ Заказ оформлен! Проверьте админ-панель.');
    }
  });

  // Обновить корзину
  document.getElementById('updateCartBtn').addEventListener('click', function() {
    loadCart();
    updateSelectedService();
    showToast('Корзина обновлена');
  });
}