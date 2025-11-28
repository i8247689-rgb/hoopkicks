// Инициализация профиля при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupMenuNavigation();
    loadFavoritesFromLocalStorage();
});

// ============ НАВИГАЦИЯ ПО МЕНЮ ============

function setupMenuNavigation() {
    const menuItems = document.querySelectorAll('.profile-menu .menu-item');
    const sections = document.querySelectorAll('.profile-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.getAttribute('data-section');
            
            // Убираем активный класс со всех элементов меню
            menuItems.forEach(m => m.classList.remove('active'));
            // Добавляем активный класс текущему элементу
            this.classList.add('active');
            
            // Скрываем все секции
            sections.forEach(section => section.classList.remove('active'));
            // Показываем нужную секцию
            document.getElementById(sectionId).classList.add('active');
        });
    });
}

// ============ ЗАГРУЗКА ИЗБРАННОГО ============

function loadFavoritesFromLocalStorage() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoritesGrid = document.getElementById('favorites-grid');
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px 20px;">Вы еще не добавили товары в избранное</p>';
        return;
    }
    
    favoritesGrid.innerHTML = '';
    
    favorites.forEach((favorite, index) => {
        const card = document.createElement('div');
        card.className = 'favorite-card';
        card.innerHTML = `
            <div class="favorite-image">
                <img src="${favorite.image}" alt="${favorite.name}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h3>${favorite.name}</h3>
            <p class="favorite-price">${favorite.price.toLocaleString('ru-RU')} ₽</p>
            <div class="favorite-actions">
                <button class="add-to-cart-btn" data-index="${index}">В корзину</button>
                <button class="remove-btn" data-index="${index}">Удалить</button>
            </div>
        `;
        
        favoritesGrid.appendChild(card);
    });
    
    // Добавляем обработчики для кнопок
    setupFavoriteActions();
}

// ============ ДЕЙСТВИЯ С ИЗБРАННЫМ ============

function setupFavoriteActions() {
    const addToCartBtns = document.querySelectorAll('.favorite-actions .add-to-cart-btn');
    const removeBtns = document.querySelectorAll('.favorite-actions .remove-btn');
    
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const favorite = favorites[index];
            
            if (favorite) {
                // Добавляем в корзину
                addFavoriteToCart(favorite);
                showNotification(favorite.name + ' добавлен в корзину!', 'success');
            }
        });
    });
    
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const favoriteName = favorites[index]?.name;
            
            // Удаляем из избранного
            favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(favorites));
            
            showNotification(favoriteName + ' удален из избранного', 'info');
            loadFavoritesFromLocalStorage();
        });
    });
}

// Функция для добавления товара из избранного в корзину
function addFavoriteToCart(favorite) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Добавляем товар в корзину (без указания размера, просто добавляем основной товар)
    const existingItem = cart.find(item => item.name === favorite.name && !item.size);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: favorite.name,
            price: favorite.price,
            image: favorite.image,
            size: '',
            quantity: 1,
            brand: favorite.brand || 'HoopKicks'
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ============ УВЕДОМЛЕНИЯ ============

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#dc3545' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
        max-width: 350px;
    `;

    document.body.appendChild(notification);

    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Добавляем глобальные стили анимаций если их ещё нет
if (!document.querySelector('style[data-profile-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-profile-animations', 'true');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100px);
            }
        }
    `;
    document.head.appendChild(style);
}
