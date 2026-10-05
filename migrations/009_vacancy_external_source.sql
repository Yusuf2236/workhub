-- 009_vacancy_external_source.sql
-- Track where imported vacancies come from so periodic syncs upsert instead of duplicating,
-- and keep a link to the original posting (applications for imported jobs go to the source site).
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE vacancies ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_vacancies_source_external_id
    ON vacancies(source, external_id) WHERE external_id IS NOT NULL;

-- Feed ordering (newest first) with a stable tiebreaker for offset pagination
CREATE INDEX IF NOT EXISTS idx_vacancies_feed_order
    ON vacancies(is_featured DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_vacancy_comments_created_at
    ON vacancy_comments(created_at DESC, id DESC);
