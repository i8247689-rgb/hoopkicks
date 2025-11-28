// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromLocalStorage();
    updateCartTotal();
    setupQuantityListeners();
    setupRemoveButtons();
    setupPromoCode();
});

// Функция для загрузки товаров из localStorage
function loadCartFromLocalStorage() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsWrapper = document.querySelector('.cart-items-wrapper');
    
    // Очищаем корзину от дефолтных товаров, если есть новые
    if (cart.length > 0) {
        cartItemsWrapper.innerHTML = '';
    }
    
    // Добавляем товары из localStorage
    cart.forEach((item, index) => {
        const cartItemHTML = `
            <div class="cart-item">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-brand">${item.brand || 'Неизвестный бренд'}</p>
                    <p class="item-size">Размер: 42</p>
                </div>
                <div class="item-price">
                    <span class="price">${item.price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div class="item-quantity">
                    <button class="qty-btn qty-minus">−</button>
                    <input type="number" class="qty-input" value="${item.quantity}" min="1">
                    <button class="qty-btn qty-plus">+</button>
                </div>
                <div class="item-total">
                    <span class="total">${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                </div>
                <button class="item-remove" title="Удалить из корзины">×</button>
            </div>
        `;
        cartItemsWrapper.insertAdjacentHTML('beforeend', cartItemHTML);
    });
}

// Функция для расчета итоговой суммы
function updateCartTotal() {
    const cartItems = document.querySelectorAll('.cart-item');
    let subtotal = 0;
    const updatedCart = [];

    cartItems.forEach(item => {
        const priceText = item.querySelector('.item-price .price').textContent;
        const price = parseFloat(priceText.replace(/\s₽/g, '').replace(/\s/g, ''));
        const quantity = parseInt(item.querySelector('.qty-input').value) || 0;
        const itemTotal = price * quantity;
        const itemName = item.querySelector('.item-details h3').textContent;
        const itemImage = item.querySelector('.item-image img').src;
        
        // Обновляем сумму товара
        item.querySelector('.item-total .total').textContent = itemTotal.toLocaleString('ru-RU') + ' ₽';
        
        subtotal += itemTotal;
        
        // Сохраняем данные для localStorage
        if (quantity > 0) {
            updatedCart.push({
                name: itemName,
                price: price,
                image: itemImage,
                quantity: quantity,
                brand: item.querySelector('.item-brand').textContent
            });
        }
    });
    
    // Обновляем localStorage
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Обновляем итоги в боковой панели
    const summaryRows = document.querySelectorAll('.summary-details .summary-row');
    if (summaryRows.length > 0) {
        summaryRows[0].querySelector('span:last-child').textContent = subtotal.toLocaleString('ru-RU') + ' ₽';
    }

    updateTotalWithDiscount(subtotal);
}

// Функция для обновления итога со скидкой
function updateTotalWithDiscount(subtotal) {
    const promoInput = document.querySelector('.promo-input');
    let discount = 0;
    let discountPercent = 0;

    // Проверяем наличие активного промокода
    if (promoInput && promoInput.classList.contains('active')) {
        discountPercent = 20;
        discount = subtotal * 0.2;
    }

    // Доставка (бесплатно, если сумма больше 50000)
    const shipping = subtotal >= 50000 ? 0 : 0;
    
    // Обновляем строку скидки
    const discountRow = document.querySelector('.summary-details .summary-row.discount');
    if (discountRow) {
        discountRow.querySelector('span:last-child').textContent = '-' + discount.toLocaleString('ru-RU') + ' ₽';
    }

    // Обновляем строку доставки
    const shippingRow = document.querySelector('.summary-details .summary-row:nth-child(2)');
    if (shippingRow) {
        const shippingSpan = shippingRow.querySelector('span:last-child');
        shippingSpan.textContent = 'Бесплатно';
        shippingSpan.className = 'free-shipping';
    }

    // Итоговая сумма
    const total = subtotal - discount;
    const totalAmount = document.querySelector('.summary-total .total-amount');
    if (totalAmount) {
        totalAmount.textContent = total.toLocaleString('ru-RU') + ' ₽';
    }
}

// Функция для удаления товара при количестве = 0
function removeItemIfEmpty(item) {
    const quantity = parseInt(item.querySelector('.qty-input').value) || 0;
    
    if (quantity <= 0) {
        // Удаляем товар из DOM с анимацией
        item.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            item.remove();
            updateCartTotal();
        }, 300);
    }
}

// Функция для установки слушателей количества
function setupQuantityListeners() {
    const qtyInputs = document.querySelectorAll('.qty-input');
    const qtyButtons = document.querySelectorAll('.qty-btn');

    // Слушатели на кнопки
    qtyButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = this.parentElement.querySelector('.qty-input');
            const currentValue = parseInt(input.value) || 0;
            
            if (this.classList.contains('qty-plus')) {
                input.value = currentValue + 1;
            } else if (this.classList.contains('qty-minus')) {
                input.value = Math.max(0, currentValue - 1);
            }
            
            const cartItem = this.closest('.cart-item');
            removeItemIfEmpty(cartItem);
            updateCartTotal();
        });
    });

    // Слушатели на поле ввода
    qtyInputs.forEach(input => {
        input.addEventListener('change', function() {
            let value = parseInt(this.value) || 0;
            
            // Если значение отрицательное, устанавливаем 0
            if (value < 0) {
                value = 0;
                this.value = 0;
            }
            
            const cartItem = this.closest('.cart-item');
            removeItemIfEmpty(cartItem);
            updateCartTotal();
        });
    });
}

// Функция для установки слушателей кнопок удаления
function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll('.item-remove');
    
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const cartItem = this.closest('.cart-item');
            cartItem.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                cartItem.remove();
                updateCartTotal();
            }, 300);
        });
    });
}

// Функция для работы с промокодом
function setupPromoCode() {
    const promoInput = document.querySelector('.promo-input');
    const promoBtn = document.querySelector('.promo-btn');

    if (promoBtn) {
        promoBtn.addEventListener('click', function() {
            const promoCode = promoInput.value.toUpperCase().trim();
            
            if (promoCode === 'HOOP20') {
                // Активируем скидку
                promoInput.classList.add('active');
                promoBtn.textContent = '✓ Применено';
                promoBtn.style.background = '#4caf50';
                promoBtn.style.borderColor = '#4caf50';
                promoBtn.style.color = 'white';
                promoInput.style.borderColor = '#4caf50';
                
                // Показываем уведомление
                showNotification('Промокод HOOP20 применен! Скидка 20% активирована.', 'success');
                
                updateCartTotal();
            } else if (promoCode === '') {
                showNotification('Пожалуйста, введите промокод', 'warning');
            } else {
                // Деактивируем если был активирован другой код
                promoInput.classList.remove('active');
                promoBtn.textContent = 'Применить';
                promoBtn.style.background = '#f8f9fa';
                promoBtn.style.borderColor = '#e0e0e0';
                promoBtn.style.color = '#666';
                promoInput.style.borderColor = '#e0e0e0';
                
                showNotification('Промокод "' + promoCode + '" не найден', 'error');
                updateCartTotal();
            }
        });
    }

    // Позволяем применять промокод через Enter
    if (promoInput) {
        promoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                promoBtn.click();
            }
        });
    }
}

// Функция для показания уведомлений
function showNotification(message, type) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#dc3545' : '#ffc107'};
        color: ${type === 'warning' ? '#333' : 'white'};
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

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-20px);
        }
    }

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

    .promo-input.active {
        border-color: #4caf50;
        background-color: #f1f8f4;
    }

    .qty-input {
        text-align: center;
    }

    .qty-input::-webkit-outer-spin-button,
    .qty-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .qty-input[type=number] {
        -moz-appearance: textfield;
    }
`;
document.head.appendChild(style);
