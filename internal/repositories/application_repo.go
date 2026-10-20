package repositories

import (
	"database/sql"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type ApplicationRepo interface {
	List() ([]models.Application, error)
	ListByUser(userID string) ([]models.Application, error)
	// ListForVacancyOwner returns applications to vacancies the given user posted,
	// with applicant and resume details for the employer.
	ListForVacancyOwner(ownerID string) ([]models.Application, error)
	Exists(userID, vacancyID string) (bool, error)
	Get(id string) (*models.Application, error)
	Create(app models.Application) error
	UpdateStatus(id, status string) error
	Count() (int, error)
}

type postgresApplicationRepo struct {
	db *sql.DB
}

func NewPostgresApplicationRepo(db *sql.DB) ApplicationRepo {
	return &postgresApplicationRepo{db: db}
}

const applicationSelect = `
	SELECT a.id, a.user_id, a.vacancy_id, COALESCE(a.resume_id::text, ''), COALESCE(a.cover_letter, ''),
	       a.status, a.created_at, a.updated_at,
	       COALESCE(v.title, ''), COALESCE(v.company, ''),
	       COALESCE(u.name, ''), COALESCE(u.email, ''), COALESCE(p.phone, ''),
	       COALESCE(r.title, ''), COALESCE(r.summary, ''), COALESCE(r.file_url, '')
	FROM applications a
	LEFT JOIN vacancies v ON v.id = a.vacancy_id
	LEFT JOIN users u ON u.id = a.user_id
	LEFT JOIN profiles p ON p.user_id = a.user_id
	LEFT JOIN resumes r ON r.id = a.resume_id`

func scanApplications(rows *sql.Rows) ([]models.Application, error) {
	defer rows.Close()
	apps := []models.Application{}
	for rows.Next() {
		var a models.Application
		if err := rows.Scan(
			&a.ID, &a.UserID, &a.VacancyID, &a.ResumeID, &a.CoverLetter,
			&a.Status, &a.CreatedAt, &a.UpdatedAt,
			&a.VacancyTitle, &a.VacancyCompany,
			&a.ApplicantName, &a.ApplicantEmail, &a.ApplicantPhone,
			&a.ResumeTitle, &a.ResumeSummary, &a.ResumeFileURL,
		); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func (r *postgresApplicationRepo) List() ([]models.Application, error) {
	rows, err := r.db.Query(applicationSelect + ` ORDER BY a.created_at DESC LIMIT 500`)
	if err != nil {
		return nil, err
	}
	return scanApplications(rows)
}

func (r *postgresApplicationRepo) ListByUser(userID string) ([]models.Application, error) {
	rows, err := r.db.Query(applicationSelect+` WHERE a.user_id = $1 ORDER BY a.created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	apps, err := scanApplications(rows)
	if err != nil {
		return nil, err
	}
	// The candidate sees their own data; contact columns are only for employers
	for i := range apps {
		apps[i].ApplicantEmail = ""
		apps[i].ApplicantPhone = ""
	}
	return apps, nil
}

func (r *postgresApplicationRepo) ListForVacancyOwner(ownerID string) ([]models.Application, error) {
	rows, err := r.db.Query(applicationSelect+` WHERE v.created_by = $1 ORDER BY a.created_at DESC`, ownerID)
	if err != nil {
		return nil, err
	}
	return scanApplications(rows)
}

func (r *postgresApplicationRepo) Exists(userID, vacancyID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM applications WHERE user_id = $1 AND vacancy_id = $2)`, userID, vacancyID).Scan(&exists)
	return exists, err
}

func (r *postgresApplicationRepo) Get(id string) (*models.Application, error) {
	rows, err := r.db.Query(applicationSelect+` WHERE a.id = $1`, id)
	if err != nil {
		return nil, err
	}
	apps, err := scanApplications(rows)
	if err != nil {
		return nil, err
	}
	if len(apps) == 0 {
		return nil, nil
	}
	return &apps[0], nil
}

func (r *postgresApplicationRepo) Create(app models.Application) error {
	query := `
		INSERT INTO applications (id, user_id, vacancy_id, resume_id, cover_letter, status, created_at, updated_at)
		VALUES ($1, $2, $3, NULLIF($4, '')::uuid, $5, $6, $7, $8)`
	_, err := r.db.Exec(query, app.ID, app.UserID, app.VacancyID, app.ResumeID, app.CoverLetter, app.Status, app.CreatedAt, app.UpdatedAt)
	return err
}

func (r *postgresApplicationRepo) UpdateStatus(id, status string) error {
	query := `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(query, status, id)
	return err
}

func (r *postgresApplicationRepo) Count() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM applications`).Scan(&count)
	return count, err
}
