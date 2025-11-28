-- =====================================================
-- 公积金智能助手 - 数据库初始化脚本
-- 与 mock-db.ts 数据同步
-- =====================================================

-- 清空数据库
DROP TABLE IF EXISTS user_attributes CASCADE;
DROP TABLE IF EXISTS account_info CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 创建表结构
-- =====================================================

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    id_card VARCHAR(18) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 公积金账户信息表
CREATE TABLE account_info (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(user_id),
    personal_account VARCHAR(50) NOT NULL,
    open_date DATE NOT NULL,
    paid_until VARCHAR(20) NOT NULL,
    id_type VARCHAR(20) DEFAULT '身份证',
    id_number VARCHAR(50) NOT NULL,
    residence VARCHAR(50) NOT NULL,
    marital_status VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    bank_name VARCHAR(50) NOT NULL,
    bank_account VARCHAR(50) NOT NULL,
    account_type VARCHAR(30) DEFAULT '公积金账户',
    account_status VARCHAR(20) NOT NULL,
    seal_date DATE,
    deposit_base DECIMAL(10,2) NOT NULL,
    personal_rate VARCHAR(10) NOT NULL,
    personal_amount DECIMAL(10,2) NOT NULL,
    company_rate VARCHAR(10) NOT NULL,
    company_amount DECIMAL(10,2) NOT NULL,
    company_name VARCHAR(100) NOT NULL,
    company_account VARCHAR(50) NOT NULL,
    total_balance DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户属性表（业务流程控制）
-- Phase 值说明 (1000-1031 线性递增):
-- 1000: 未开始 | 1015: 本人未手机签约 | 1018: 本人未银行卡签约 | 1029: 满足提取条件
CREATE TABLE user_attributes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(user_id),
    city VARCHAR(50) DEFAULT '福州',
    phase VARCHAR(20) DEFAULT '1000',
    is_auth BOOLEAN DEFAULT false,
    is_authenticated BOOLEAN DEFAULT false,
    is_married BOOLEAN DEFAULT false,
    spouse_authorized BOOLEAN DEFAULT false,
    history_extract_types JSONB DEFAULT '[]',
    permit_extract_types JSONB DEFAULT '[]',
    can_extract BOOLEAN DEFAULT true,
    cannot_extract_reason VARCHAR(255),
    sms_signed BOOLEAN DEFAULT false,
    bank_card_signed BOOLEAN DEFAULT false,
    current_extract_type VARCHAR(50),
    current_type_needs_auth BOOLEAN DEFAULT false,
    current_type_authorized BOOLEAN DEFAULT false,
    extract_verified BOOLEAN DEFAULT false,
    extract_code_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 插入测试数据
-- =====================================================

-- 用户数据
INSERT INTO users (user_id, name, id_card, phone, password) VALUES 
('U001', '张三', '350102199001011234', '13800138001', 'admin123'),
('U002', '李四', '350102199202022345', '13800138002', 'admin123'),
('U003', '王五', '350102199303033456', '13800138003', 'admin123'),
('U004', '赵六', '350102199404044567', '13800138004', 'admin123');

-- 公积金账户信息
INSERT INTO account_info (
    user_id, personal_account, open_date, paid_until, id_type, id_number, 
    residence, marital_status, phone, bank_name, bank_account,
    account_type, account_status, seal_date, deposit_base, personal_rate, 
    personal_amount, company_rate, company_amount,
    company_name, company_account, total_balance
) VALUES 
-- U001 张三 - 封存账户
('U001', '12****789', '2020-05-05', '2022-05', '身份证', '35**************345',
    '福州', '已婚', '157****9013', '中国工商银行', '6214 **** **** 1234',
    '公积金账户', '封存', '2022-06-05', 5000.00, '12%',
    600.00, '12%', 600.00, '福州测试公司', '12**********123', 72000.00),
-- U002 李四 - 正常账户
('U002', '12****456', '2019-03-15', '2024-11', '身份证', '35**************678',
    '厦门', '未婚', '138****2002', '中国建设银行', '6227 **** **** 5678',
    '公积金账户', '正常', NULL, 8000.00, '12%',
    960.00, '12%', 960.00, '厦门科技有限公司', '35**********456', 138240.00),
-- U003 王五 - 正常账户
('U003', '12****321', '2021-08-20', '2024-11', '身份证', '35**************901',
    '泉州', '已婚', '159****3003', '中国农业银行', '6228 **** **** 9012',
    '公积金账户', '正常', NULL, 6500.00, '10%',
    650.00, '10%', 650.00, '泉州贸易有限公司', '35**********789', 50700.00),
-- U004 赵六 - 封存账户
('U004', '12****654', '2018-01-10', '2023-08', '身份证', '35**************234',
    '漳州', '离异', '186****4004', '招商银行', '6225 **** **** 3456',
    '公积金账户', '封存', '2023-09-01', 4500.00, '8%',
    360.00, '8%', 360.00, '漳州物流有限公司', '35**********012', 48960.00);

-- 用户属性数据（与 mock-db.ts 同步）
-- U001: phase=1000 未开始，演示完整流程
-- U002: phase=1015 本人未手机签约
-- U003: phase=1018 本人未银行卡签约
-- U004: phase=1029 满足提取条件
INSERT INTO user_attributes (
    user_id, city, phase, is_auth, is_authenticated, is_married, 
    spouse_authorized, history_extract_types, permit_extract_types, 
    can_extract, sms_signed, bank_card_signed
) VALUES 
('U001', '福州', '1000', false, true, true, true, '["租房"]', '["租房", "购房", "公积金贷款", "组合贷款"]', true, false, false),
('U002', '泉州', '1015', true, false, false, false, '[]', '["租房", "购房", "公积金贷款", "组合贷款", "离职", "退休"]', true, false, false),
('U003', '厦门', '1018', true, true, false, false, '["购房"]', '["购房", "公积金贷款", "组合贷款"]', true, true, false),
('U004', '莆田', '1029', true, true, true, false, '[]', '["租房", "购房"]', true, true, true);

-- 创建索引
CREATE INDEX idx_account_info_user_id ON account_info(user_id);
CREATE INDEX idx_user_attributes_user_id ON user_attributes(user_id);

-- =====================================================
-- 验证数据
-- =====================================================
SELECT 
    u.name as 姓名,
    u.phone as 手机号,
    ua.city as 城市,
    ua.phase as 阶段,
    ua.is_auth as 已授权,
    ua.sms_signed as 手机签约,
    ua.bank_card_signed as 银行卡签约,
    a.total_balance as 账户余额
FROM users u
JOIN user_attributes ua ON u.user_id = ua.user_id
JOIN account_info a ON u.user_id = a.user_id
ORDER BY u.user_id;
