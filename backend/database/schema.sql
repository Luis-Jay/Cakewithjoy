-- ═══════════════════════════════════════════════════════════════
-- Cake with Joy — BMS Database Schema
-- ═══════════════════════════════════════════════════════════════
CREATE DATABASE IF NOT EXISTS bms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bms;

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
    id              VARCHAR(128)    PRIMARY KEY,  -- Firebase UID
    email           VARCHAR(255)    NOT NULL UNIQUE,
    full_name       VARCHAR(255)    NOT NULL,
    phone           VARCHAR(30),
    role            ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    avatar_url      TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
-- PRODUCT CATALOG
-- ─────────────────────────────────────────
CREATE TABLE categories (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    slug        VARCHAR(100)    NOT NULL UNIQUE,
    sort_order  INT             NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    category_id     INT             NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    base_price      DECIMAL(10,2)   NOT NULL,
    image_url       TEXT,
    is_available    BOOLEAN         NOT NULL DEFAULT TRUE,
    is_customizable BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_variants (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    product_id  INT             NOT NULL,
    label       VARCHAR(100)    NOT NULL,
    sku         VARCHAR(50),
    price       DECIMAL(10,2)   NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE addons (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    product_id  INT,
    name        VARCHAR(150)    NOT NULL,
    price       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    is_included BOOLEAN         NOT NULL DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
CREATE TABLE orders (
    id                  INT             PRIMARY KEY AUTO_INCREMENT,
    order_number        VARCHAR(20)     NOT NULL UNIQUE,
    customer_id         VARCHAR(128)    NOT NULL,
    staff_id            VARCHAR(128),
    status              ENUM('pending','confirmed','baking','ready_for_pickup','completed','cancelled')
                        NOT NULL DEFAULT 'pending',
    discount_type       ENUM('none','senior','pwd') NOT NULL DEFAULT 'none',
    discount_amount     DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    subtotal            DECIMAL(10,2)   NOT NULL,
    total_amount        DECIMAL(10,2)   NOT NULL,
    amount_paid         DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    payment_reference   VARCHAR(100),
    special_notes       TEXT,
    pickup_date         DATE,
    pickup_time         TIME,
    cancellation_reason TEXT,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    order_id        INT             NOT NULL,
    product_id      INT             NOT NULL,
    variant_id      INT,
    quantity        INT             NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2)   NOT NULL,
    line_total      DECIMAL(10,2)   NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

CREATE TABLE order_item_addons (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    item_id     INT             NOT NULL,
    addon_id    INT             NOT NULL,
    price       DECIMAL(10,2)   NOT NULL,
    FOREIGN KEY (item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_id) REFERENCES addons(id)
);

CREATE TABLE order_customizations (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    order_item_id   INT             NOT NULL UNIQUE,
    cake_type       ENUM('Fondant','Naked','Number','Bento') NOT NULL,
    flavor          VARCHAR(100),
    icing           VARCHAR(100),
    dedication_msg  VARCHAR(255),
    reference_image TEXT,
    servings_count  INT,
    custom_notes    TEXT,
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

CREATE TABLE order_status_history (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    order_id    INT             NOT NULL,
    changed_by  VARCHAR(128)    NOT NULL,
    old_status  VARCHAR(30),
    new_status  VARCHAR(30)     NOT NULL,
    note        TEXT,
    changed_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- INVENTORY
-- ─────────────────────────────────────────
CREATE TABLE ingredients (
    id                  INT             PRIMARY KEY AUTO_INCREMENT,
    name                VARCHAR(255)    NOT NULL UNIQUE,
    unit                VARCHAR(30)     NOT NULL,
    low_stock_threshold DECIMAL(10,3)   NOT NULL DEFAULT 0,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_batches (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    ingredient_id   INT             NOT NULL,
    quantity        DECIMAL(10,3)   NOT NULL,
    expiration_date DATE,
    received_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_depleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    INDEX idx_ingredient_active (ingredient_id, is_depleted)
);

CREATE TABLE recipe_ingredients (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    product_id      INT             NOT NULL,
    ingredient_id   INT             NOT NULL,
    quantity_needed DECIMAL(10,3)   NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- ─────────────────────────────────────────
-- PRODUCTION
-- ─────────────────────────────────────────
CREATE TABLE production_tasks (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    order_id        INT             NOT NULL,
    assigned_to     VARCHAR(128),
    scheduled_date  DATE            NOT NULL,
    start_time      TIME,
    end_time        TIME,
    status          ENUM('scheduled','in_progress','done','blocked') NOT NULL DEFAULT 'scheduled',
    priority        ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
    notes           TEXT,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- COMMUNICATION
-- ─────────────────────────────────────────
CREATE TABLE announcements (
    id          INT             PRIMARY KEY AUTO_INCREMENT,
    author_id   VARCHAR(128)    NOT NULL,
    title       VARCHAR(255)    NOT NULL,
    body        TEXT            NOT NULL,
    target_role ENUM('all','staff','admin') NOT NULL DEFAULT 'all',
    is_pinned   BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE contact_inquiries (
    id              INT             PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone           VARCHAR(30),
    subject         VARCHAR(255),
    message         TEXT            NOT NULL,
    status          ENUM('new','read','replied','closed') NOT NULL DEFAULT 'new',
    replied_at      DATETIME,
    replied_by      VARCHAR(128),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (replied_by) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- SYSTEM
-- ─────────────────────────────────────────
CREATE TABLE system_settings (
    key_name    VARCHAR(100)    PRIMARY KEY,
    value       TEXT            NOT NULL,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default settings
INSERT INTO system_settings (key_name, value) VALUES
    ('bakery_name', 'Cake with Joy'),
    ('advance_booking_days', '7'),
    ('tax_rate', '0.12'),
    ('business_hours', '{"open": "08:00", "close": "20:00"}');
