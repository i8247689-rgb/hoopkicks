<?php
require_once 'config/database.php';

class Order {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    // Создать заказ
    public function createOrder($orderData, $cartItems) {
        try {
            // Начать транзакцию
            $this->db->getConnection()->beginTransaction();
            
            // Генерировать номер заказа
            $orderNumber = generateOrderNumber();
            
            // Вставить заказ
            $sql = "INSERT INTO orders (
                user_id, order_number, payment_method, total_amount, 
                discount_amount, shipping_cost, tax_amount, final_amount,
                customer_email, customer_phone, customer_first_name, customer_last_name,
                shipping_address, billing_address, notes
            ) VALUES (
                :user_id, :order_number, :payment_method, :total_amount,
                :discount_amount, :shipping_cost, :tax_amount, :final_amount,
                :customer_email, :customer_phone, :customer_first_name, :customer_last_name,
                :shipping_address, :billing_address, :notes
            )";
            
            $this->db->execute($sql, [
                ':user_id' => $orderData['user_id'] ?? null,
                ':order_number' => $orderNumber,
                ':payment_method' => $orderData['payment_method'],
                ':total_amount' => $orderData['total_amount'],
                ':discount_amount' => $orderData['discount_amount'] ?? 0,
                ':shipping_cost' => $orderData['shipping_cost'] ?? 0,
                ':tax_amount' => $orderData['tax_amount'] ?? 0,
                ':final_amount' => $orderData['final_amount'],
                ':customer_email' => $orderData['customer_email'],
                ':customer_phone' => $orderData['customer_phone'],
                ':customer_first_name' => $orderData['customer_first_name'],
                ':customer_last_name' => $orderData['customer_last_name'],
                ':shipping_address' => $orderData['shipping_address'],
                ':billing_address' => $orderData['billing_address'] ?? $orderData['shipping_address'],
                ':notes' => $orderData['notes'] ?? null
            ]);
            
            $orderId = $this->db->lastInsertId();
            
            // Добавить товары в заказ
            foreach ($cartItems as $item) {
                $itemPrice = $item['price'] + $item['price_modifier'];
                $totalPrice = $itemPrice * $item['quantity'];
                
                $sql = "INSERT INTO order_items (
                    order_id, product_id, variant_id, product_name, product_sku,
                    color_name, size_value, quantity, unit_price, total_price
                ) VALUES (
                    :order_id, :product_id, :variant_id, :product_name, :product_sku,
                    :color_name, :size_value, :quantity, :unit_price, :total_price
                )";
                
                $this->db->execute($sql, [
                    ':order_id' => $orderId,
                    ':product_id' => $item['product_id'],
                    ':variant_id' => $item['variant_id'],
                    ':product_name' => $item['product_name'],
                    ':product_sku' => $item['sku_variant'],
                    ':color_name' => $item['color_name'],
                    ':size_value' => $item['size_value'],
                    ':quantity' => $item['quantity'],
                    ':unit_price' => $itemPrice,
                    ':total_price' => $totalPrice
                ]);
                
                // Уменьшить количество товара на складе
                $sql = "UPDATE product_variants 
                        SET stock_quantity = stock_quantity - :quantity 
                        WHERE variant_id = :variant_id";
                
                $this->db->execute($sql, [
                    ':quantity' => $item['quantity'],
                    ':variant_id' => $item['variant_id']
                ]);
            }
            
            // Добавить запись в историю статусов
            $this->addStatusHistory($orderId, null, 'pending');
            
            // Завершить транзакцию
            $this->db->getConnection()->commit();
            
            return [
                'success' => true,
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'message' => 'Заказ успешно создан'
            ];
            
        } catch (Exception $e) {
            // Откатить транзакцию в случае ошибки
            $this->db->getConnection()->rollBack();
            
            return [
                'success' => false,
                'message' => 'Ошибка при создании заказа: ' . $e->getMessage()
            ];
        }
    }
    
    // Получить заказ по ID
    public function getOrderById($orderId, $userId = null) {
        $sql = "SELECT * FROM orders WHERE order_id = :order_id";
        $params = [':order_id' => $orderId];
        
        if ($userId) {
            $sql .= " AND user_id = :user_id";
            $params[':user_id'] = $userId;
        }
        
        return $this->db->fetchOne($sql, $params);
    }
    
    // Получить заказ по номеру
    public function getOrderByNumber($orderNumber, $userId = null) {
        $sql = "SELECT * FROM orders WHERE order_number = :order_number";
        $params = [':order_number' => $orderNumber];
        
        if ($userId) {
            $sql .= " AND user_id = :user_id";
            $params[':user_id'] = $userId;
        }
        
        return $this->db->fetchOne($sql, $params);
    }
    
    // Получить товары заказа
    public function getOrderItems($orderId) {
        $sql = "SELECT oi.*,
                (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as image_url
                FROM order_items oi
                WHERE oi.order_id = :order_id";
        
        return $this->db->fetchAll($sql, [':order_id' => $orderId]);
    }
    
    // Обновить статус заказа
    public function updateOrderStatus($orderId, $newStatus, $comment = null) {
        // Получить текущий статус
        $order = $this->getOrderById($orderId);
        
        if (!$order) {
            return ['success' => false, 'message' => 'Заказ не найден'];
        }
        
        $oldStatus = $order['order_status'];
        
        // Обновить статус
        $sql = "UPDATE orders SET order_status = :status WHERE order_id = :order_id";
        $result = $this->db->execute($sql, [
            ':status' => $newStatus,
            ':order_id' => $orderId
        ]);
        
        if ($result) {
            // Добавить запись в историю
            $this->addStatusHistory($orderId, $oldStatus, $newStatus, $comment);
            
            return ['success' => true, 'message' => 'Статус заказа обновлен'];
        }
        
        return ['success' => false, 'message' => 'Ошибка при обновлении статуса'];
    }
    
    // Обновить статус оплаты
    public function updatePaymentStatus($orderId, $paymentStatus) {
        $sql = "UPDATE orders SET payment_status = :payment_status WHERE order_id = :order_id";
        return $this->db->execute($sql, [
            ':payment_status' => $paymentStatus,
            ':order_id' => $orderId
        ]);
    }
    
    // Добавить запись в историю статусов
    private function addStatusHistory($orderId, $oldStatus, $newStatus, $comment = null) {
        $sql = "INSERT INTO order_status_history (order_id, old_status, new_status, comment) 
                VALUES (:order_id, :old_status, :new_status, :comment)";
        
        return $this->db->execute($sql, [
            ':order_id' => $orderId,
            ':old_status' => $oldStatus,
            ':new_status' => $newStatus,
            ':comment' => $comment
        ]);
    }
    
    // Получить историю статусов заказа
    public function getOrderStatusHistory($orderId) {
        $sql = "SELECT * FROM order_status_history 
                WHERE order_id = :order_id 
                ORDER BY changed_at ASC";
        
        return $this->db->fetchAll($sql, [':order_id' => $orderId]);
    }
    
    // Отменить заказ
    public function cancelOrder($orderId, $userId = null) {
        $order = $this->getOrderById($orderId, $userId);
        
        if (!$order) {
            return ['success' => false, 'message' => 'Заказ не найден'];
        }
        
        // Проверить, можно ли отменить заказ
        $cancelableStatuses = ['pending', 'confirmed'];
        
        if (!in_array($order['order_status'], $cancelableStatuses)) {
            return ['success' => false, 'message' => 'Заказ нельзя отменить на текущем этапе'];
        }
        
        try {
            $this->db->getConnection()->beginTransaction();
            
            // Вернуть товары на склад
            $items = $this->getOrderItems($orderId);
            
            foreach ($items as $item) {
                $sql = "UPDATE product_variants 
                        SET stock_quantity = stock_quantity + :quantity 
                        WHERE variant_id = :variant_id";
                
                $this->db->execute($sql, [
                    ':quantity' => $item['quantity'],
                    ':variant_id' => $item['variant_id']
                ]);
            }
            
            // Обновить статус заказа
            $this->updateOrderStatus($orderId, 'cancelled', 'Отменено пользователем');
            
            $this->db->getConnection()->commit();
            
            return ['success' => true, 'message' => 'Заказ отменен'];
            
        } catch (Exception $e) {
            $this->db->getConnection()->rollBack();
            return ['success' => false, 'message' => 'Ошибка при отмене заказа'];
        }
    }
    
    // Получить заказы пользователя
    public function getUserOrders($userId, $limit = 10, $offset = 0) {
        $sql = "SELECT o.*, 
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
                FROM orders o
                WHERE o.user_id = :user_id 
                ORDER BY o.created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        return $this->db->fetchAll($sql, [
            ':user_id' => $userId,
            ':limit' => $limit,
            ':offset' => $offset
        ]);
    }
    
    // Получить количество заказов пользователя
    public function getUserOrdersCount($userId) {
        $sql = "SELECT COUNT(*) as total FROM orders WHERE user_id = :user_id";
        $result = $this->db->fetchOne($sql, [':user_id' => $userId]);
        return $result['total'] ?? 0;
    }
}
?>