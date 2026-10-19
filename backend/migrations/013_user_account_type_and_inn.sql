-- 013_user_account_type_and_inn.sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS inn VARCHAR(20) DEFAULT '';
