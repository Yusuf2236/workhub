-- 007_rebrand_to_wzone.sql
ALTER TABLE vacancies ALTER COLUMN source SET DEFAULT 'WZone';

UPDATE vacancies SET source = 'WZone' WHERE source = 'WorkHub' OR source IS NULL;
UPDATE vacancies SET description = REPLACE(description, 'WorkHub', 'WZone') WHERE description LIKE '%WorkHub%';
UPDATE vacancies SET title = REPLACE(title, 'WorkHub', 'WZone') WHERE title LIKE '%WorkHub%';
UPDATE vacancies SET company = REPLACE(company, 'WorkHub', 'WZone') WHERE company LIKE '%WorkHub%';
