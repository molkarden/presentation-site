// js/reviews.js — логика страницы отзывов

let currentUser = null;

// Загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();
  loadReviews();
  initStarRating();
  setupFormHandler();
});

// Загрузка профиля пользователя
function loadUserProfile() {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        currentUser = data.user;
        document.getElementById('reviewName').value = data.user.name || '';
      }
    })
    .catch(() => {
      const savedProfile = JSON.parse(localStorage.getItem('userProfile'));
      if (savedProfile) {
        currentUser = savedProfile;
        document.getElementById('reviewName').value = `${savedProfile.firstName || ''} ${savedProfile.lastName || ''}`.trim();
      }
    });
  }
}

// Расчёт среднего рейтинга
function calculateAverageRating(reviews) {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// Обновление статистики
function updateStats(reviews) {
  document.getElementById('totalReviews').textContent = reviews.length > 0 ? reviews.length : '127+';
  document.getElementById('averageRating').textContent = reviews.length > 0 ? calculateAverageRating(reviews) : '4.9';
}

// Загрузка отзывов
function loadReviews() {
  // Пробуем загрузить с сервера
  fetch('/api/reviews')
    .then(res => res.json())
    .then(data => {
      if (data.reviews && data.reviews.length > 0) {
        renderReviews(data.reviews);
        updateStats(data.reviews);
      } else {
        loadLocalReviews();
      }
    })
    .catch(() => {
      loadLocalReviews();
    });
}

// Загрузка из localStorage
function loadLocalReviews() {
  const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
  
  if (reviews.length === 0) {
    loadDefaultReviews();
    return;
  }
  
  renderReviews(reviews);
  updateStats(reviews);
}

// Дефолтные отзывы
function loadDefaultReviews() {
  const defaultReviews = [
    {
      name: 'Анна Иванова',
      position: 'Директор по маркетингу, TechCompany',
      rating: 5,
      date: '2025-08-25',
      text: 'Заказывали презентацию для инвесторов. Результат превзошёл все ожидания! Команда профессионально подошла к задаче, учла все нюансы нашего бренда.'
    },
    {
      name: 'Пётр Сидоров',
      position: 'Основатель стартапа GreenTech',
      rating: 5,
      date: '2025-08-23',
      text: 'Обратился срочно — нужно было за 2 дня подготовить питч для конкурса. Сделали всё быстро и качественно!'
    },
    {
      name: 'Мария Козлова',
      position: 'Преподаватель университета',
      rating: 5,
      date: '2025-09-20',
      text: 'Заказывала образовательные презентации для курса. Очень довольна результатом! Студенты стали лучше усваивать информацию.'
    },
    {
      name: 'Дмитрий Васильев',
      position: 'Руководитель отдела продаж',
      rating: 5,
      date: '2025-10-05',
      text: 'Презентация для ключевого клиента была сделана просто блестяще! Клиент подписал контракт сразу после встречи.'
    }
  ];
  
  renderReviews(defaultReviews);
  updateStats(defaultReviews);
}

// Отрисовка отзывов
function renderReviews(reviews) {
  const container = document.getElementById('reviewsContainer');
  container.innerHTML = '';
  
  reviews.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));
  
  reviews.forEach((review, index) => {
    const col = document.createElement('div');
    col.className = 'col-lg-6 mb-4';
    
    const name = review.author_name || review.name;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    
    const date = new Date(review.date || review.created_at);
    const formattedDate = date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    
    col.innerHTML = `
      <div class="review-card p-4">
        <div class="d-flex align-items-center mb-4">
          <div class="avatar me-3">${initials}</div>
          <div class="flex-grow-1">
            <h5 class="mb-1 client-name">${name}</h5>
            <p class="review-meta mb-1">${review.position || ''}</p>
            <div>
              <span class="star">${stars}</span>
              <span class="review-meta ms-2">${formattedDate}</span>
            </div>
          </div>
        </div>
        <div class="review-text">${review.text}</div>
      </div>
    `;
    
    container.appendChild(col);
  });
}

// Инициализация звёздного рейтинга
function initStarRating() {
  const stars = document.querySelectorAll('.star-rating .star');
  const selectedRating = document.getElementById('selectedRating');
  
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      selectedRating.value = rating;
      
      stars.forEach((s, index) => {
        s.style.color = index < rating ? '#ffd700' : '#ccc';
      });
    });
  });
  
  // По умолчанию 5 звёзд
  stars.forEach(s => s.style.color = '#ffd700');
}

// Отправка отзыва
function setupFormHandler() {
  document.getElementById('addReviewForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('reviewName').value.trim();
    const position = document.getElementById('reviewPosition').value.trim();
    const rating = parseInt(document.getElementById('selectedRating').value);
    const text = document.getElementById('reviewText').value.trim();
    
    if (!name || !text) {
      alert('Заполните имя и текст отзыва');
      return;
    }
    
    const newReview = { name, position, rating, text, date: new Date().toISOString() };
    
    // Пробуем отправить на сервер
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ rating, text })
      });
      
      if (res.ok) {
        loadReviews();
        resetForm();
        return;
      }
    } catch (err) {}
    
    // Сохраняем локально
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    reviews.push(newReview);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    
    resetForm();
    loadReviews();
    alert('Отзыв добавлен!');
  });
}

// Сброс формы
function resetForm() {
  document.getElementById('addReviewForm').reset();
  document.getElementById('selectedRating').value = 5;
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach(s => s.style.color = '#ffd700');
  
  if (currentUser) {
    document.getElementById('reviewName').value = currentUser.name || '';
  }
}