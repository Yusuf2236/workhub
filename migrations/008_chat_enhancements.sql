-- 008_chat_enhancements.sql
-- Allow guest / non-registered users to participate in chats
ALTER TABLE chat_messages ALTER COLUMN user_id DROP NOT NULL;

-- Add explicit sender_name and sender_avatar columns for persistent display
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255) DEFAULT 'WZone Foydalanuvchisi';
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_avatar TEXT DEFAULT '';

-- Fast room history ordering and pagination index
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(room_id, created_at ASC);
