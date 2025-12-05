<?php
require_once 'config/database.php';

class User {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    // Регистрация нового пользователя
    public function register($email, $password, $firstName, $lastName, $phone = null) {
        // Проверка, существует ли пользователь
        if ($this->getUserByEmail($email)) {
            return ['success' => false, 'message' => 'Пользователь с таким email уже существует'];
        }
        
        $passwordHash = hashPassword($password);
        
        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, phone) 
                VALUES (:email, :password_hash, :first_name, :last_name, :phone)";
        
        $result = $this->db->execute($sql, [
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':phone' => $phone
        ]);
        
        if ($result) {
            return [
                'success' => true,
                'user_id' => $this->db->lastInsertId(),
                'message' => 'Регистрация успешна'
            ];
        }
        
        return ['success' => false, 'message' => 'Ошибка при регистрации'];
    }
    
    // Авторизация пользователя
    public function login($email, $password) {
        $user = $this->getUserByEmail($email);
        
        if (!$user) {
            return ['success' => false, 'message' => 'Неверный email или пароль'];
        }
        
        if (!$user['is_active']) {
            return ['success' => false, 'message' => 'Аккаунт заблокирован'];
        }
        
        if (verifyPassword($password, $user['password_hash'])) {
            // Успешная авторизация
            $_SESSION['user_id'] = $user['user_id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
            
            return [
                'success' => true,
                'user' => $user,
                'message' => 'Вход выполнен успешно'
            ];
        }
        
        return ['success' => false, 'message' => 'Неверный email или пароль'];
    }
    
    // Выход из системы
    public function logout() {
        unset($_SESSION['user_id']);
        unset($_SESSION['user_email']);
        unset($_SESSION['user_name']);
        session_destroy();
    }
    
    // Получить пользователя по email
    public function getUserByEmail($email) {
        $sql = "SELECT * FROM users WHERE email = :email";
        return $this->db->fetchOne($sql, [':email' => $email]);
    }
    
    // Получить пользователя по ID
    public function getUserById($userId) {
        $sql = "SELECT user_id, email, first_name, last_name, phone, created_at, is_active 
                FROM users WHERE user_id = :user_id";
        return $this->db->fetchOne($sql, [':user_id' => $userId]);
    }
    
    // Обновить профиль пользователя
    public function updateProfile($userId, $firstName, $lastName, $phone) {
        $sql = "UPDATE users 
                SET first_name = :first_name, 
                    last_name = :last_name, 
                    phone = :phone 
                WHERE user_id = :user_id";
        
        $result = $this->db->execute($sql, [
            ':user_id' => $userId,
            ':first_name' => $firstName,
            ':last_name' => $lastName,
            ':phone' => $phone
        ]);
        
        if ($result) {
            $_SESSION['user_name'] = $firstName . ' ' . $lastName;
            return ['success' => true, 'message' => 'Профиль обновлен'];
        }
        
        return ['success' => false, 'message' => 'Ошибка при обновлении профиля'];
    }
    
    // Изменить пароль
    public function changePassword($userId, $oldPassword, $newPassword) {
        $user = $this->getUserById($userId);
        
        if (!$user) {
            return ['success' => false, 'message' => 'Пользователь не найден'];
        }
        
        // Получить хеш пароля
        $sql = "SELECT password_hash FROM users WHERE user_id = :user_id";
        $userData = $this->db->fetchOne($sql, [':user_id' => $userId]);
        
        if (!verifyPassword($oldPassword, $userData['password_hash'])) {
            return ['success' => false, 'message' => 'Неверный текущий пароль'];
        }
        
        $newPasswordHash = hashPassword($newPassword);
        
        $sql = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
        $result = $this->db->execute($sql, [
            ':password_hash' => $newPasswordHash,
            ':user_id' => $userId
        ]);
        
        if ($result) {
            return ['success' => true, 'message' => 'Пароль изменен'];
        }
        
        return ['success' => false, 'message' => 'Ошибка при изменении пароля'];
    }
    
    // Добавить адрес доставки
    public function addAddress($userId, $addressType, $city, $postalCode, $streetAddress, $apartment = null, $isDefault = false) {
        // Если это адрес по умолчанию, снять флаг с других адресов
        if ($isDefault) {
            $sql = "UPDATE addresses SET is_default = 0 WHERE user_id = :user_id";
            $this->db->execute($sql, [':user_id' => $userId]);
        }
        
        $sql = "INSERT INTO addresses (user_id, address_type, city, postal_code, street_address, apartment, is_default) 
                VALUES (:user_id, :address_type, :city, :postal_code, :street_address, :apartment, :is_default)";
        
        return $this->db->execute($sql, [
            ':user_id' => $userId,
            ':address_type' => $addressType,
            ':city' => $city,
            ':postal_code' => $postalCode,
            ':street_address' => $streetAddress,
            ':apartment' => $apartment,
            ':is_default' => $isDefault
        ]);
    }
    
    // Получить адреса пользователя
    public function getUserAddresses($userId) {
        $sql = "SELECT * FROM addresses WHERE user_id = :user_id ORDER BY is_default DESC, created_at DESC";
        return $this->db->fetchAll($sql, [':user_id' => $userId]);
    }
    
    // Удалить адрес
    public function deleteAddress($addressId, $userId) {
        $sql = "DELETE FROM addresses WHERE address_id = :address_id AND user_id = :user_id";
        return $this->db->execute($sql, [
            ':address_id' => $addressId,
            ':user_id' => $userId
        ]);
    }
    
    // Получить заказы пользователя
    public function getUserOrders($userId, $limit = 10, $offset = 0) {
        $sql = "SELECT * FROM orders 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        return $this->db->fetchAll($sql, [
            ':user_id' => $userId,
            ':limit' => $limit,
            ':offset' => $offset
        ]);
    }
}
?>