<?php
require_once 'config/database.php';

class Cart {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    // Получить или создать корзину
    public function getOrCreateCart($userId = null, $sessionId = null) {
        if ($userId) {
            $sql = "SELECT * FROM cart WHERE user_id = :user_id";
            $cart = $this->db->fetchOne($sql, [':user_id' => $userId]);
        } else {
            $sql = "SELECT * FROM cart WHERE session_id = :session_id";
            $cart = $this->db->fetchOne($sql, [':session_id' => $sessionId]);
        }
        
        if (!$cart) {
            $sql = "INSERT INTO cart (user_id, session_id) VALUES (:user_id, :session_id)";
            $this->db->execute($sql, [
                ':user_id' => $userId,
                ':session_id' => $sessionId
            ]);
            
            $cartId = $this->db->lastInsertId();
            return $this->getCartById($cartId);
        }
        
        return $cart;
    }
    
    // Получить корзину по ID
    private function getCartById($cartId) {
        $sql = "SELECT * FROM cart WHERE cart_id = :cart_id";
        return $this->db->fetchOne($sql, [':cart_id' => $cartId]);
    }
    
    // Получить товары в корзине
    public function getCartItems($cartId) {
        $sql = "SELECT ci.*, 
                p.product_id, p.product_name, p.product_slug, p.price, p.old_price,
                pv.sku_variant, pv.price_modifier,
                pc.color_name, pc.color_code,
                s.size_value,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url
                FROM cart_items ci
                LEFT JOIN product_variants pv ON ci.variant_id = pv.variant_id
                LEFT JOIN products p ON pv.product_id = p.product_id
                LEFT JOIN product_colors pc ON pv.color_id = pc.color_id
                LEFT JOIN sizes s ON pv.size_id = s.size_id
                WHERE ci.cart_id = :cart_id";
        
        return $this->db->fetchAll($sql, [':cart_id' => $cartId]);
    }
    
    // Добавить товар в корзину
    public function addItem($cartId, $variantId, $quantity = 1) {
        // Проверить, есть ли уже этот товар в корзине
        $sql = "SELECT * FROM cart_items WHERE cart_id = :cart_id AND variant_id = :variant_id";
        $existingItem = $this->db->fetchOne($sql, [
            ':cart_id' => $cartId,
            ':variant_id' => $variantId
        ]);
        
        if ($existingItem) {
            // Если товар уже есть, увеличиваем количество
            $sql = "UPDATE cart_items 
                    SET quantity = quantity + :quantity 
                    WHERE cart_item_id = :cart_item_id";
            
            return $this->db->execute($sql, [
                ':quantity' => $quantity,
                ':cart_item_id' => $existingItem['cart_item_id']
            ]);
        } else {
            // Если товара нет, добавляем новый
            $sql = "INSERT INTO cart_items (cart_id, variant_id, quantity) 
                    VALUES (:cart_id, :variant_id, :quantity)";
            
            return $this->db->execute($sql, [
                ':cart_id' => $cartId,
                ':variant_id' => $variantId,
                ':quantity' => $quantity
            ]);
        }
    }
    
    // Обновить количество товара в корзине
    public function updateItemQuantity($cartItemId, $quantity) {
        if ($quantity <= 0) {
            return $this->removeItem($cartItemId);
        }
        
        $sql = "UPDATE cart_items SET quantity = :quantity WHERE cart_item_id = :cart_item_id";
        return $this->db->execute($sql, [
            ':quantity' => $quantity,
            ':cart_item_id' => $cartItemId
        ]);
    }
    
    // Удалить товар из корзины
    public function removeItem($cartItemId) {
        $sql = "DELETE FROM cart_items WHERE cart_item_id = :cart_item_id";
        return $this->db->execute($sql, [':cart_item_id' => $cartItemId]);
    }
    
    // Очистить корзину
    public function clearCart($cartId) {
        $sql = "DELETE FROM cart_items WHERE cart_id = :cart_id";
        return $this->db->execute($sql, [':cart_id' => $cartId]);
    }
    
    // Получить количество товаров в корзине
    public function getCartItemsCount($cartId) {
        $sql = "SELECT SUM(quantity) as total FROM cart_items WHERE cart_id = :cart_id";
        $result = $this->db->fetchOne($sql, [':cart_id' => $cartId]);
        return $result['total'] ?? 0;
    }
    
    // Рассчитать общую стоимость корзины
    public function calculateCartTotal($cartId) {
        $items = $this->getCartItems($cartId);
        $total = 0;
        
        foreach ($items as $item) {
            $itemPrice = $item['price'] + $item['price_modifier'];
            $total += $itemPrice * $item['quantity'];
        }
        
        return $total;
    }
    
    // Получить детали корзины с товарами
    public function getCartDetails($userId = null, $sessionId = null) {
        $cart = $this->getOrCreateCart($userId, $sessionId);
        $items = $this->getCartItems($cart['cart_id']);
        $total = $this->calculateCartTotal($cart['cart_id']);
        $itemsCount = $this->getCartItemsCount($cart['cart_id']);
        
        return [
            'cart' => $cart,
            'items' => $items,
            'total' => $total,
            'items_count' => $itemsCount
        ];
    }
    
    // Перенести корзину гостя на пользователя при авторизации
    public function mergeGuestCart($userId, $sessionId) {
        // Получить корзину гостя
        $guestCart = $this->getOrCreateCart(null, $sessionId);
        $guestItems = $this->getCartItems($guestCart['cart_id']);
        
        if (empty($guestItems)) {
            return true;
        }
        
        // Получить или создать корзину пользователя
        $userCart = $this->getOrCreateCart($userId, null);
        
        // Перенести товары из корзины гостя в корзину пользователя
        foreach ($guestItems as $item) {
            $this->addItem($userCart['cart_id'], $item['variant_id'], $item['quantity']);
        }
        
        // Удалить корзину гостя
        $this->clearCart($guestCart['cart_id']);
        $sql = "DELETE FROM cart WHERE cart_id = :cart_id";
        $this->db->execute($sql, [':cart_id' => $guestCart['cart_id']]);
        
        return true;
    }
}
?>