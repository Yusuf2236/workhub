-- 010_applications_details_and_settings.sql
-- Applications keep the cover letter and the resume the candidate chose, and
-- profiles get their missing columns plus notification/privacy settings.
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT NOT NULL DEFAULT '';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_vacancy_id ON applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_by ON vacancies(created_by);

-- The profile code has always read skills and phone, but no migration created them,
-- so loading or saving a profile failed with "column does not exist".
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;
