// js/main.js — общие скрипты

// Проверка авторизации
function checkAuth() {
  const token = localStorage.getItem('token');
  const cabinetLink = document.getElementById('cabinetLink');
  const loginLink = document.getElementById('loginLink');
  
  if (token) {
    // Авторизован — показываем кабинет
    if (cabinetLink) cabinetLink.style.display = 'block';
    if (loginLink) loginLink.style.display = 'none';
  } else {
    // Не авторизован — показываем вход
    if (cabinetLink) cabinetLink.style.display = 'none';
    if (loginLink) loginLink.style.display = 'block';
  }
}

// Активная ссылка в навигации
function setActiveLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });
}

// Выход из системы
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userProfile');
  window.location.href = 'index.html';
}

// Запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  setActiveLink();
  
  // Обработчик кнопки выхода
  const logoutBtn = document.getElementById('logoutNavBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Вы уверены, что хотите выйти?')) {
        logout();
      }
    });
  }
});