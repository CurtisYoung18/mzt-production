-- Create account_info table for housing fund account details
CREATE TABLE IF NOT EXISTS account_info (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(user_id),
    
    -- 个人基础信息
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
    
    -- 公积金缴存信息
    account_type VARCHAR(30) DEFAULT '公积金账户',
    account_status VARCHAR(20) NOT NULL,
    seal_date DATE,
    deposit_base DECIMAL(10,2) NOT NULL,
    personal_rate VARCHAR(10) NOT NULL,
    personal_amount DECIMAL(10,2) NOT NULL,
    company_rate VARCHAR(10) NOT NULL,
    company_amount DECIMAL(10,2) NOT NULL,
    
    -- 单位信息
    company_name VARCHAR(100) NOT NULL,
    company_account VARCHAR(50) NOT NULL,
    
    -- 账户余额
    total_balance DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert mock data for each user
INSERT INTO account_info (
    user_id, personal_account, open_date, paid_until, id_type, id_number, 
    residence, marital_status, phone, bank_name, bank_account,
    account_type, account_status, seal_date, deposit_base, personal_rate, 
    personal_amount, company_rate, company_amount,
    company_name, company_account, total_balance
) VALUES 
-- 张三 (U001) - 封存账户
(
    'U001', '12****789', '2020-05-05', '2022-05', '身份证', '35**************345',
    '福州', '已婚', '157****9013', '中国工商银行', '6214 **** **** 1234',
    '公积金账户', '封存', '2022-06-05', 5000.00, '12%',
    600.00, '12%', 600.00,
    '福州测试公司', '12**********123', 72000.00
),
-- 李四 (U002) - 正常账户
(
    'U002', '12****456', '2019-03-15', '2024-11', '身份证', '35**************678',
    '厦门', '未婚', '138****2002', '中国建设银行', '6227 **** **** 5678',
    '公积金账户', '正常', NULL, 8000.00, '12%',
    960.00, '12%', 960.00,
    '厦门科技有限公司', '35**********456', 138240.00
),
-- 王五 (U003) - 正常账户
(
    'U003', '12****321', '2021-08-20', '2024-11', '身份证', '35**************901',
    '泉州', '已婚', '159****3003', '中国农业银行', '6228 **** **** 9012',
    '公积金账户', '正常', NULL, 6500.00, '10%',
    650.00, '10%', 650.00,
    '泉州贸易有限公司', '35**********789', 50700.00
),
-- 赵六 (U004) - 封存账户
(
    'U004', '12****654', '2018-01-10', '2023-08', '身份证', '35**************234',
    '漳州', '离异', '186****4004', '招商银行', '6225 **** **** 3456',
    '公积金账户', '封存', '2023-09-01', 4500.00, '8%',
    360.00, '8%', 360.00,
    '漳州物流有限公司', '35**********012', 48960.00
)
ON CONFLICT (user_id) DO UPDATE SET
    personal_account = EXCLUDED.personal_account,
    open_date = EXCLUDED.open_date,
    paid_until = EXCLUDED.paid_until,
    id_number = EXCLUDED.id_number,
    residence = EXCLUDED.residence,
    marital_status = EXCLUDED.marital_status,
    phone = EXCLUDED.phone,
    bank_name = EXCLUDED.bank_name,
    bank_account = EXCLUDED.bank_account,
    account_status = EXCLUDED.account_status,
    seal_date = EXCLUDED.seal_date,
    deposit_base = EXCLUDED.deposit_base,
    personal_rate = EXCLUDED.personal_rate,
    personal_amount = EXCLUDED.personal_amount,
    company_rate = EXCLUDED.company_rate,
    company_amount = EXCLUDED.company_amount,
    company_name = EXCLUDED.company_name,
    company_account = EXCLUDED.company_account,
    total_balance = EXCLUDED.total_balance,
    updated_at = CURRENT_TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_info_user_id ON account_info(user_id);

-- Verify data
SELECT 
    u.name as 用户姓名,
    a.personal_account as 个人账户,
    a.account_status as 账户状态,
    a.deposit_base as 缴存基数,
    a.total_balance as 账户余额,
    a.company_name as 单位名称
FROM account_info a
JOIN users u ON a.user_id = u.user_id
ORDER BY u.id;

