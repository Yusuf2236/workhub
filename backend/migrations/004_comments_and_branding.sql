-- 004_comments_and_branding.sql
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'WorkHub';

CREATE TABLE IF NOT EXISTS vacancy_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id UUID NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vacancy_comments_vac_id ON vacancy_comments(vacancy_id);
