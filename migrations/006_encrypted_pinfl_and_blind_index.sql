-- 006_encrypted_pinfl_and_blind_index.sql
-- Expand pinfl column to TEXT to hold AES-256-GCM authenticated ciphertext
ALTER TABLE users ALTER COLUMN pinfl TYPE TEXT;

-- Add blind index column for secure, zero-knowledge O(1) indexed lookups
ALTER TABLE users ADD COLUMN IF NOT EXISTS pinfl_hash VARCHAR(64);
CREATE INDEX IF NOT EXISTS idx_users_pinfl_hash ON users(pinfl_hash);
