<?php
require_once 'config/database.php';

class Product {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    // Получить все товары с фильтрами
    public function getAll($filters = [], $limit = 20, $offset = 0) {
        $sql = "SELECT p.*, b.brand_name, c.category_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url,
                (SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE p.is_active = 1";
        
        $params = [];
        
        // Фильтр по категории
        if (!empty($filters['category_id'])) {
            $sql .= " AND p.category_id = :category_id";
            $params[':category_id'] = $filters['category_id'];
        }
        
        // Фильтр по бренду
        if (!empty($filters['brand_id'])) {
            $sql .= " AND p.brand_id = :brand_id";
            $params[':brand_id'] = $filters['brand_id'];
        }
        
        // Фильтр по цене
        if (!empty($filters['min_price'])) {
            $sql .= " AND p.price >= :min_price";
            $params[':min_price'] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $sql .= " AND p.price <= :max_price";
            $params[':max_price'] = $filters['max_price'];
        }
        
        // Фильтр по новинкам
        if (!empty($filters['is_new'])) {
            $sql .= " AND p.is_new = 1";
        }
        
        // Поиск
        if (!empty($filters['search'])) {
            $sql .= " AND (p.product_name LIKE :search OR p.description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }
        
        // Сортировка
        $orderBy = " ORDER BY ";
        switch ($filters['sort'] ?? 'popular') {
            case 'price_asc':
                $orderBy .= "p.price ASC";
                break;
            case 'price_desc':
                $orderBy .= "p.price DESC";
                break;
            case 'new':
                $orderBy .= "p.created_at DESC";
                break;
            case 'discount':
                $orderBy .= "p.discount_percentage DESC";
                break;
            default:
                $orderBy .= "p.is_featured DESC, p.created_at DESC";
        }
        
        $sql .= $orderBy;
        $sql .= " LIMIT :limit OFFSET :offset";
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;
        
        return $this->db->fetchAll($sql, $params);
    }
    
    // Получить количество товаров
    public function getCount($filters = []) {
        $sql = "SELECT COUNT(*) as total FROM products p WHERE p.is_active = 1";
        $params = [];
        
        if (!empty($filters['category_id'])) {
            $sql .= " AND p.category_id = :category_id";
            $params[':category_id'] = $filters['category_id'];
        }
        
        if (!empty($filters['brand_id'])) {
            $sql .= " AND p.brand_id = :brand_id";
            $params[':brand_id'] = $filters['brand_id'];
        }
        
        if (!empty($filters['min_price'])) {
            $sql .= " AND p.price >= :min_price";
            $params[':min_price'] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $sql .= " AND p.price <= :max_price";
            $params[':max_price'] = $filters['max_price'];
        }
        
        if (!empty($filters['search'])) {
            $sql .= " AND (p.product_name LIKE :search OR p.description LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }
        
        $result = $this->db->fetchOne($sql, $params);
        return $result['total'] ?? 0;
    }
    
    // Получить товар по ID
    public function getById($id) {
        $sql = "SELECT p.*, b.brand_name, b.brand_slug, c.category_name, c.category_slug,
                (SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE p.product_id = :id AND p.is_active = 1";
        
        return $this->db->fetchOne($sql, [':id' => $id]);
    }
    
    // Получить товар по slug
    public function getBySlug($slug) {
        $sql = "SELECT p.*, b.brand_name, b.brand_slug, c.category_name, c.category_slug,
                (SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as review_count
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                LEFT JOIN categories c ON p.category_id = c.category_id
                WHERE p.product_slug = :slug AND p.is_active = 1";
        
        return $this->db->fetchOne($sql, [':slug' => $slug]);
    }
    
    // Получить изображения товара
    public function getImages($productId) {
        $sql = "SELECT * FROM product_images 
                WHERE product_id = :product_id 
                ORDER BY is_primary DESC, display_order ASC";
        
        return $this->db->fetchAll($sql, [':product_id' => $productId]);
    }
    
    // Получить варианты товара (размеры и цвета)
    public function getVariants($productId) {
        $sql = "SELECT pv.*, pc.color_name, pc.color_code, s.size_value
                FROM product_variants pv
                LEFT JOIN product_colors pc ON pv.color_id = pc.color_id
                LEFT JOIN sizes s ON pv.size_id = s.size_id
                WHERE pv.product_id = :product_id AND pv.is_available = 1
                ORDER BY s.size_value, pc.color_name";
        
        return $this->db->fetchAll($sql, [':product_id' => $productId]);
    }
    
    // Получить характеристики товара
    public function getSpecifications($productId) {
        $sql = "SELECT * FROM product_specifications 
                WHERE product_id = :product_id 
                ORDER BY display_order ASC";
        
        return $this->db->fetchAll($sql, [':product_id' => $productId]);
    }
    
    // Получить отзывы товара
    public function getReviews($productId, $limit = 10, $offset = 0) {
        $sql = "SELECT r.*, u.first_name, u.last_name
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.user_id
                WHERE r.product_id = :product_id AND r.is_approved = 1
                ORDER BY r.created_at DESC
                LIMIT :limit OFFSET :offset";
        
        return $this->db->fetchAll($sql, [
            ':product_id' => $productId,
            ':limit' => $limit,
            ':offset' => $offset
        ]);
    }
    
    // Получить похожие товары
    public function getSimilarProducts($productId, $categoryId, $limit = 4) {
        $sql = "SELECT p.*, b.brand_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.category_id = :category_id 
                AND p.product_id != :product_id 
                AND p.is_active = 1
                ORDER BY RAND()
                LIMIT :limit";
        
        return $this->db->fetchAll($sql, [
            ':category_id' => $categoryId,
            ':product_id' => $productId,
            ':limit' => $limit
        ]);
    }
    
    // Получить популярные товары
    public function getPopularProducts($limit = 8) {
        $sql = "SELECT p.*, b.brand_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url,
                (SELECT AVG(rating) FROM reviews WHERE product_id = p.product_id AND is_approved = 1) as avg_rating
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.is_active = 1 AND p.is_featured = 1
                ORDER BY p.created_at DESC
                LIMIT :limit";
        
        return $this->db->fetchAll($sql, [':limit' => $limit]);
    }
    
    // Получить новинки
    public function getNewProducts($limit = 8) {
        $sql = "SELECT p.*, b.brand_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = 1 LIMIT 1) as image_url
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.brand_id
                WHERE p.is_active = 1 AND p.is_new = 1
                ORDER BY p.created_at DESC
                LIMIT :limit";
        
        return $this->db->fetchAll($sql, [':limit' => $limit]);
    }
    
    // Проверить доступность варианта товара
    public function checkVariantAvailability($variantId) {
        $sql = "SELECT * FROM product_variants 
                WHERE variant_id = :variant_id 
                AND is_available = 1 
                AND stock_quantity > 0";
        
        return $this->db->fetchOne($sql, [':variant_id' => $variantId]);
    }
    
    // Уменьшить количество товара на складе
    public function decreaseStock($variantId, $quantity) {
        $sql = "UPDATE product_variants 
                SET stock_quantity = stock_quantity - :quantity 
                WHERE variant_id = :variant_id";
        
        return $this->db->execute($sql, [
            ':variant_id' => $variantId,
            ':quantity' => $quantity
        ]);
    }
}
?>