-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    id_card VARCHAR(18) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data (optional - remove this line if you want to keep existing data)
-- TRUNCATE TABLE users RESTART IDENTITY;

-- Insert users data
INSERT INTO users (id, user_id, name, id_card, phone, password, created_at) 
VALUES 
    (1, 'U001', '张三', '350102199001011234', '13800138001', 'admin123', '2025-11-26 09:36:33.385087'),
    (2, 'U002', '李四', '350102199202022345', '13800138002', 'admin123', '2025-11-26 09:36:33.385087'),
    (3, 'U003', '王五', '350102199303033456', '13800138003', 'admin123', '2025-11-26 09:36:33.385087'),
    (4, 'U004', '赵六', '350102199404044567', '13800138004', 'admin123', '2025-11-26 09:36:33.385087')
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    id_card = EXCLUDED.id_card,
    phone = EXCLUDED.phone,
    password = EXCLUDED.password;

-- Reset sequence to avoid ID conflicts for future inserts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

