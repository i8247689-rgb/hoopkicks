// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupHoverButtons();
    setupSortingSelect();
    setupFilterReset();
});

// Функция для настройки кнопок при наведении
function setupHoverButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Обработчик для кнопки быстрого просмотра - просто переходит на страницу товара
    quickViewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productLink = this.closest('.catalog-product-link');
            if (productLink) {
                window.location.href = productLink.href;
            }
        });
    });

    // Обработчик для кнопки добавления в корзину
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = this.closest('.catalog-product-card');
            const productName = productCard.querySelector('.product-info h3').textContent;
            const productLink = this.closest('.catalog-product-link').href;
            const productImage = productCard.querySelector('.product-image img').src;
            
            // Получаем цену (может быть старая цена через span)
            const priceElement = productCard.querySelector('.product-price');
            let productPrice = '';
            if (priceElement.querySelector('.old-price')) {
                productPrice = priceElement.textContent.trim().split('\n').pop();
            } else {
                productPrice = priceElement.textContent.trim();
            }
            
            addToCart(productName, productPrice, productImage, productLink);
            
            // Показываем уведомление
            showNotification(productName + ' добавлен в корзину!', 'success');
            
            // Анимация кнопки
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
}

// Функция для добавления товара в корзину (в localStorage)
function addToCart(productName, productPrice, productImage, productLink) {
    // Получаем корзину из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Извлекаем цену (число)
    const price = parseFloat(productPrice.replace(/\s₽/g, '').replace(/\s/g, '')) || 0;
    
    // Проверяем, есть ли уже такой товар в корзине
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        existingItem.quantity += 1;
    } else {
        // Добавляем новый товар
        cart.push({
            name: productName,
            price: price,
            image: productImage,
            link: productLink,
            quantity: 1
        });
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Функция для настройки сортировки
function setupSortingSelect() {
    const sortSelect = document.querySelector('.sort-select');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        const sortValue = this.value;
        sortCatalog(sortValue);
    });
}

// Функция для сортировки каталога
function sortCatalog(sortType) {
    const catalogGrid = document.querySelector('.catalog-grid');
    const products = Array.from(catalogGrid.querySelectorAll('.catalog-product-link'));

    products.sort((a, b) => {
        let compareResult = 0;

        switch(sortType) {
            case 'popular':
                // По популярности (по количеству отзывов)
                const reviewsA = parseInt(a.querySelector('.product-rating span').textContent.match(/\d+/)[0]) || 0;
                const reviewsB = parseInt(b.querySelector('.product-rating span').textContent.match(/\d+/)[0]) || 0;
                compareResult = reviewsB - reviewsA;
                break;

            case 'price-asc':
                // Сначала дешевые
                const priceA = getPriceFromElement(a.querySelector('.product-price'));
                const priceB = getPriceFromElement(b.querySelector('.product-price'));
                compareResult = priceA - priceB;
                break;

            case 'price-desc':
                // Сначала дорогие
                const priceC = getPriceFromElement(a.querySelector('.product-price'));
                const priceD = getPriceFromElement(b.querySelector('.product-price'));
                compareResult = priceD - priceC;
                break;

            case 'new':
                // По новинкам (новинки впереди)
                const isBadgeA = a.querySelector('.product-badge.new') ? 1 : 0;
                const isBadgeB = b.querySelector('.product-badge.new') ? 1 : 0;
                compareResult = isBadgeB - isBadgeA;
                break;

            case 'discount':
                // Со скидкой (товары со скидкой впереди)
                const hasSaleA = a.querySelector('.product-badge.sale') ? 1 : 0;
                const hasSaleB = b.querySelector('.product-badge.sale') ? 1 : 0;
                compareResult = hasSaleB - hasSaleA;
                break;

            default:
                compareResult = 0;
        }

        return compareResult;
    });

    // Перерисовываем каталог
    products.forEach(product => {
        catalogGrid.appendChild(product);
    });
}

// Функция для извлечения цены из элемента
function getPriceFromElement(priceElement) {
    const priceText = priceElement.textContent;
    // Извлекаем последнее число (основная цена, если есть старая цена)
    const prices = priceText.match(/\d+\s*\d{0,3}/g);
    if (prices) {
        const lastPrice = prices[prices.length - 1];
        return parseInt(lastPrice.replace(/\s/g, ''));
    }
    return 0;
}

// Функция для сброса фильтров
function setupFilterReset() {
    const resetBtn = document.querySelector('.reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Сброс чекбоксов
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });

            // Сброс ползунка цены
            const priceSlider = document.querySelector('.price-slider');
            if (priceSlider) {
                priceSlider.value = priceSlider.max;
            }

            // Сброс полей цены
            document.querySelectorAll('.price-inputs input').forEach((input, index) => {
                if (index === 0) input.value = '0';
                else input.value = priceSlider?.max || '30000';
            });

            // Возвращаем сортировку по умолчанию
            const sortSelect = document.querySelector('.sort-select');
            if (sortSelect) {
                sortSelect.value = 'popular';
                sortCatalog('popular');
            }

            showNotification('Фильтры сброшены', 'info');
        });
    }
}

// Функция для показания уведомлений
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
        max-width: 300px;
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
if (!document.querySelector('style[data-catalog-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-catalog-animations', 'true');
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
