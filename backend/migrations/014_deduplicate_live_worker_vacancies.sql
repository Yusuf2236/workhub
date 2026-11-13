-- 014_deduplicate_live_worker_vacancies.sql
-- Removes cloned duplicate vacancies posted by the worker (same title and company, created_by IS NULL),
-- keeping the earliest record and deleting identical copies to keep the feed fresh and diverse.

CREATE TEMP TABLE IF NOT EXISTS worker_dupes ON COMMIT DROP AS
SELECT id, keeper_id
FROM (
    SELECT id,
           first_value(id) OVER w AS keeper_id,
           row_number() OVER w AS rn
    FROM vacancies
    WHERE created_by IS NULL
    WINDOW w AS (
        PARTITION BY lower(trim(title)), lower(trim(company))
        ORDER BY created_at DESC, id
    )
) ranked
WHERE rn > 1;

-- Clean up dependent tables safely
DELETE FROM applications a
USING worker_dupes d
WHERE a.vacancy_id = d.id;

UPDATE vacancy_comments c SET vacancy_id = d.keeper_id FROM worker_dupes d WHERE c.vacancy_id = d.id;

-- Delete duplicate clone vacancies
DELETE FROM vacancies v USING worker_dupes d WHERE v.id = d.id;
