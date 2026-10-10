-- ============================================================================
-- Migration: 002_create_products_table.sql
-- Description: Creates the 'products' table for VendorSaathi product management
--              Includes foreign key to vendors, indexes for fast search/filtering,
--              check constraints, and automatic updated_at timestamp trigger.
-- ============================================================================

-- 1. Create enum for standard produce/grocery units (optional / or varchar)
CREATE TABLE IF NOT EXISTS vendors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(32) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'vendor',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    vendor_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) CHECK (original_price IS NULL OR original_price >= 0),
    unit VARCHAR(50) NOT NULL,
    available_quantity NUMERIC(10, 2) NOT NULL DEFAULT 10.00 CHECK (available_quantity >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    stock_status VARCHAR(32) NOT NULL DEFAULT 'in-stock' CHECK (stock_status IN ('in-stock', 'low-stock', 'out-of-stock')),
    image_url TEXT,
    description TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.80 CHECK (rating >= 0 AND rating <= 5.00),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraint to ensure vendor ownership integrity
    CONSTRAINT fk_products_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- 3. High-Performance Indexes for Filtering & Search
-- Composite index for vendor products listing & category filtering
CREATE INDEX IF NOT EXISTS idx_products_vendor_category
    ON products (vendor_id, category);

-- Composite index for vendor stock status queries
CREATE INDEX IF NOT EXISTS idx_products_vendor_availability
    ON products (vendor_id, is_available);

-- Fast sorting by recency
CREATE INDEX IF NOT EXISTS idx_products_vendor_updated_at
    ON products (vendor_id, updated_at DESC);

-- Trigram / B-tree search index for product search by name
CREATE INDEX IF NOT EXISTS idx_products_name_search
    ON products (name);

-- 4. Trigger to auto-update 'updated_at' on row modification (PostgreSQL)
CREATE OR REPLACE FUNCTION update_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_timestamp();

-- 5. Seed Initial Catalog Data for Demo Vendor (Ramesh Grocery)
INSERT INTO vendors (id, name, business_name, email, phone, role, status)
VALUES ('v1', 'Ramesh Gowda', 'Ramesh Grocery', 'ramesh.kirana@gmail.com', '+91 98451 23456', 'vendor', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, vendor_id, name, short_name, category, price, unit, available_quantity, is_available, stock_status, image_url, description)
VALUES 
    ('prod_tomato_01', 'v1', 'Fresh Farm Red Tomatoes', 'Tomato', 'Vegetable', 25.00, 'kg', 18.00, true, 'in-stock', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80', 'Crisp local farm tomatoes from Moodbidri.'),
    ('prod_potato_02', 'v1', 'Fresh Local Potatoes', 'Potato', 'Vegetable', 30.00, 'kg', 12.00, true, 'in-stock', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80', 'High-quality cooking potatoes.'),
    ('prod_rose_03', 'v1', 'Pooja Red Roses', 'Rose', 'Flower', 60.00, 'bunch', 15.00, true, 'in-stock', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80', 'Fresh fragrant roses for temple worship.'),
    ('prod_milk_04', 'v1', 'Fresh Dairy Milk', 'Milk', 'Dairy', 28.00, 'litre', 25.00, true, 'in-stock', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80', 'Pure pasteurized cow milk.'),
    ('prod_chips_05', 'v1', 'Crispy Banana Chips', 'Snacks', 'Snacks', 50.00, 'packet', 0.00, false, 'out-of-stock', 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=500&q=80', 'Coconut oil fried banana chips.')
ON CONFLICT (id) DO NOTHING;
