-- 011_remove_duplicate_vacancies.sql
-- The old Python scraper inserted the same posting many times (same title, company and
-- region, only the generated description text differed). Keep the oldest copy of each,
-- move applications, comments and views onto it, and delete the rest.
-- Vacancies posted by users (created_by set) are never touched.

CREATE TEMP TABLE vacancy_dupes ON COMMIT DROP AS
SELECT id, keeper_id
FROM (
    SELECT id,
           first_value(id) OVER w AS keeper_id,
           row_number() OVER w AS rn
    FROM vacancies
    WHERE created_by IS NULL
    WINDOW w AS (
        PARTITION BY lower(trim(title)), lower(trim(company)), lower(trim(coalesce(location, '')))
        ORDER BY created_at, id
    )
) ranked
WHERE rn > 1;

-- A candidate who applied to several copies keeps only their earliest application
DELETE FROM applications a
USING vacancy_dupes d
WHERE a.vacancy_id = d.id
  AND EXISTS (
      SELECT 1
      FROM applications other
      LEFT JOIN vacancy_dupes od ON od.id = other.vacancy_id
      WHERE other.user_id = a.user_id
        AND coalesce(od.keeper_id, other.vacancy_id) = d.keeper_id
        AND (other.created_at, other.id) < (a.created_at, a.id)
  );

UPDATE applications a SET vacancy_id = d.keeper_id FROM vacancy_dupes d WHERE a.vacancy_id = d.id;
UPDATE vacancy_comments c SET vacancy_id = d.keeper_id FROM vacancy_dupes d WHERE c.vacancy_id = d.id;

UPDATE vacancies v
SET views_count = v.views_count + s.views
FROM (
    SELECT d.keeper_id, sum(coalesce(dv.views_count, 0)) AS views
    FROM vacancy_dupes d
    JOIN vacancies dv ON dv.id = d.id
    GROUP BY d.keeper_id
) s
WHERE v.id = s.keeper_id;

DELETE FROM vacancies v USING vacancy_dupes d WHERE v.id = d.id;
