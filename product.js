// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    setupSizeSelector();
    setupQuantityControls();
    setupAddToCartButton();
    setupAddToFavoritesButton();
    setupSizeChartModal();
});

// ============ МОДАЛЬНОЕ ОКНО ТАБЛИЦЫ РАЗМЕРОВ ============

// Функция для открытия таблицы размеров
function setupSizeChartModal() {
    const sizeChartBtn = document.querySelector('.size-chart-btn');
    
    if (sizeChartBtn) {
        sizeChartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSizeChartModal();
        });
    }
}

// Функция для отображения модального окна таблицы размеров
function showSizeChartModal() {
    // Удаляем старый модал если есть
    const oldModal = document.querySelector('.size-chart-modal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.className = 'size-chart-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <h2>Таблица размеров</h2>
            <div class="size-chart-wrapper">
                <table class="size-chart-table">
                    <thead>
                        <tr>
                            <th>Российский размер</th>
                            <th>EU</th>
                            <th>USA</th>
                            <th>UK</th>
                            <th>Длина стопы (см)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>35</td>
                            <td>35</td>
                            <td>3.5</td>
                            <td>2.5</td>
                            <td>22</td>
                        </tr>
                        <tr>
                            <td>36</td>
                            <td>36</td>
                            <td>4</td>
                            <td>3</td>
                            <td>22.5</td>
                        </tr>
                        <tr>
                            <td>37</td>
                            <td>37</td>
                            <td>5</td>
                            <td>4</td>
                            <td>23</td>
                        </tr>
                        <tr>
                            <td>38</td>
                            <td>38</td>
                            <td>5.5</td>
                            <td>4.5</td>
                            <td>23.5</td>
                        </tr>
                        <tr>
                            <td>39</td>
                            <td>39</td>
                            <td>6</td>
                            <td>5</td>
                            <td>24</td>
                        </tr>
                        <tr>
                            <td>40</td>
                            <td>40</td>
                            <td>6.5</td>
                            <td>5.5</td>
                            <td>24.5</td>
                        </tr>
                        <tr>
                            <td>41</td>
                            <td>41</td>
                            <td>7</td>
                            <td>6</td>
                            <td>25</td>
                        </tr>
                        <tr>
                            <td>42</td>
                            <td>42</td>
                            <td>8</td>
                            <td>7</td>
                            <td>25.5</td>
                        </tr>
                        <tr>
                            <td>43</td>
                            <td>43</td>
                            <td>8.5</td>
                            <td>7.5</td>
                            <td>26</td>
                        </tr>
                        <tr>
                            <td>44</td>
                            <td>44</td>
                            <td>9</td>
                            <td>8</td>
                            <td>26.5</td>
                        </tr>
                        <tr>
                            <td>45</td>
                            <td>45</td>
                            <td>10</td>
                            <td>9</td>
                            <td>27</td>
                        </tr>
                        <tr>
                            <td>46</td>
                            <td>46</td>
                            <td>10.5</td>
                            <td>9.5</td>
                            <td>27.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    document.body.appendChild(modal);

    // Добавляем стили для модала
    const style = document.createElement('style');
    style.textContent = `
        .size-chart-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .size-chart-modal .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
        }

        .size-chart-modal .modal-content {
            position: relative;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 900px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease-out;
        }

        .size-chart-modal h2 {
            margin-top: 0;
            margin-bottom: 30px;
            font-size: 28px;
            color: #1a1a1a;
        }

        .size-chart-modal .modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: none;
            border: none;
            font-size: 35px;
            cursor: pointer;
            color: #999;
            transition: color 0.3s;
            line-height: 1;
        }

        .size-chart-modal .modal-close:hover {
            color: #1a1a1a;
        }

        .size-chart-wrapper {
            overflow-x: auto;
        }

        .size-chart-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .size-chart-table thead {
            background: #f8f9fa;
        }

        .size-chart-table th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #1a1a1a;
            border-bottom: 2px solid #e0e0e0;
        }

        .size-chart-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e0e0e0;
            color: #666;
        }

        .size-chart-table tbody tr:hover {
            background: #f8f9fa;
        }

        .size-chart-table tbody tr:last-child td {
            border-bottom: none;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 768px) {
            .size-chart-modal .modal-content {
                padding: 25px;
                width: 95%;
            }

            .size-chart-modal h2 {
                font-size: 22px;
                margin-bottom: 20px;
            }

            .size-chart-table th,
            .size-chart-table td {
                padding: 10px 8px;
                font-size: 13px;
            }
        }
    `;
    document.head.appendChild(style);

    // Закрытие модала
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    
    overlay.addEventListener('click', () => modal.remove());
    closeBtn.addEventListener('click', () => modal.remove());

    // Закрытие на Escape
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// ============ ВЫБОР РАЗМЕРА ============

function setupSizeSelector() {
    const sizeOptions = document.querySelectorAll('.size-option');
    
    sizeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Убираем активный класс со всех опций
            sizeOptions.forEach(opt => opt.classList.remove('active'));
            // Добавляем активный класс текущей опции
            this.classList.add('active');
        });
    });
}

// ============ КОЛИЧЕСТВО ============

function setupQuantityControls() {
    const minusBtn = document.querySelector('.qty-minus');
    const plusBtn = document.querySelector('.qty-plus');
    const qtyInput = document.querySelector('.qty-product');
    
    if (minusBtn && plusBtn && qtyInput) {
        minusBtn.addEventListener('click', function() {
            let currentValue = parseInt(qtyInput.value) || 1;
            if (currentValue > 1) {
                qtyInput.value = currentValue - 1;
            }
        });

        plusBtn.addEventListener('click', function() {
            let currentValue = parseInt(qtyInput.value) || 1;
            qtyInput.value = currentValue + 1;
        });

        // Также позволяем вводить значение руками
        qtyInput.addEventListener('change', function() {
            let value = parseInt(this.value) || 1;
            if (value < 1) {
                value = 1;
                this.value = value;
            }
        });
    }
}

// ============ ДОБАВЛЕНИЕ В КОРЗИНУ ============

function setupAddToCartButton() {
    const addToCartBtn = document.querySelector('.add-to-cart-product-btn');
    
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const productName = document.querySelector('h1').textContent;
            const productPrice = document.querySelector('.product-main-price').textContent.trim();
            const productImage = document.querySelector('.product-main-image img').src;
            const selectedSize = document.querySelector('.size-option.active');
            const quantity = parseInt(document.querySelector('.qty-product').value) || 1;
            
            // Проверяем, выбран ли размер
            if (!selectedSize) {
                showNotification('Пожалуйста, выберите размер', 'error');
                return;
            }
            
            const size = selectedSize.textContent.trim();
            addToCart(productName, productPrice, productImage, size, quantity);
            showNotification(`${productName} (размер ${size}, кол-во ${quantity}) добавлен в корзину!`, 'success');
            
            // Анимация кнопки
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    }
}

// Функция для добавления товара в корзину (в localStorage)
function addToCart(productName, productPrice, productImage, size, quantity) {
    // Получаем корзину из localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Извлекаем цену (число)
    const price = parseFloat(productPrice.replace(/\s₽/g, '').replace(/\s/g, '')) || 0;
    
    // Создаем уникальный ключ для товара (имя + размер)
    const cartItemKey = productName + '_' + size;
    
    // Проверяем, есть ли уже такой товар с таким размером в корзине
    const existingItem = cart.find(item => 
        item.name === productName && item.size === size
    );
    
    if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        existingItem.quantity += quantity;
    } else {
        // Добавляем новый товар
        cart.push({
            name: productName,
            price: price,
            image: productImage,
            size: size,
            quantity: quantity,
            brand: 'HoopKicks'
        });
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ============ ДОБАВЛЕНИЕ В ИЗБРАННОЕ ============

function setupAddToFavoritesButton() {
    const addToFavBtn = document.querySelector('.add-to-favorites-btn');
    
    if (addToFavBtn) {
        const productName = document.querySelector('h1').textContent;
        const productImage = document.querySelector('.product-main-image img').src;
        const productPrice = document.querySelector('.product-main-price').textContent.trim();
        
        // Проверяем, есть ли товар в избранном
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorite = favorites.some(fav => fav.name === productName);
        
        if (isFavorite) {
            addToFavBtn.classList.add('active');
            addToFavBtn.textContent = '❤️ В избранном';
        }
        
        addToFavBtn.addEventListener('click', function() {
            toggleFavorite(productName, productImage, productPrice, this);
        });
    }
}

// Функция для добавления/удаления из избранного
function toggleFavorite(productName, productImage, productPrice, btn) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    // Извлекаем цену (число)
    const price = parseFloat(productPrice.replace(/\s₽/g, '').replace(/\s/g, '')) || 0;
    
    // Проверяем, есть ли товар в избранном
    const existingIndex = favorites.findIndex(fav => fav.name === productName);
    
    if (existingIndex !== -1) {
        // Товар в избранном - удаляем
        favorites.splice(existingIndex, 1);
        btn.classList.remove('active');
        btn.textContent = '🤍 Добавить в избранное';
        showNotification(productName + ' удален из избранного', 'info');
    } else {
        // Товара нет в избранном - добавляем
        favorites.push({
            name: productName,
            price: price,
            image: productImage,
            brand: 'HoopKicks',
            addedDate: new Date().toISOString()
        });
        btn.classList.add('active');
        btn.textContent = '❤️ В избранном';
        showNotification(productName + ' добавлен в избранное!', 'success');
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
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
if (!document.querySelector('style[data-product-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-product-animations', 'true');
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

        .size-option {
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .size-option.active {
            border-color: #ff6b35 !important;
            background: #fff5f0 !important;
        }

        .add-to-favorites-btn {
            transition: all 0.3s ease;
        }

        .add-to-favorites-btn.active {
            color: #ff6b35;
        }
    `;
    document.head.appendChild(style);
}