package repositories

import (
	"database/sql"
	"errors"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type ResumeRepo interface {
	ListAll() ([]models.Resume, error)
	ListByUser(userID string) ([]models.Resume, error)
	Create(r models.Resume) error
	Get(id string) (*models.Resume, error)
	Delete(id string) error
	Count() (int, error)
}

type postgresResumeRepo struct {
	db *sql.DB
}

func NewPostgresResumeRepo(db *sql.DB) ResumeRepo {
	return &postgresResumeRepo{db: db}
}

func (r *postgresResumeRepo) ListAll() ([]models.Resume, error) {
	query := `
		SELECT id, user_id, title, COALESCE(summary, ''), COALESCE(file_url, ''), created_at, updated_at
		FROM resumes
		ORDER BY created_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resumes := []models.Resume{}
	for rows.Next() {
		var res models.Resume
		if err := rows.Scan(&res.ID, &res.UserID, &res.Title, &res.Summary, &res.FileURL, &res.CreatedAt, &res.UpdatedAt); err != nil {
			return nil, err
		}
		resumes = append(resumes, res)
	}
	return resumes, rows.Err()
}

func (r *postgresResumeRepo) ListByUser(userID string) ([]models.Resume, error) {
	query := `
		SELECT id, user_id, title, COALESCE(summary, ''), COALESCE(file_url, ''), created_at, updated_at
		FROM resumes
		WHERE user_id = $1
		ORDER BY created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resumes := []models.Resume{}
	for rows.Next() {
		var res models.Resume
		if err := rows.Scan(&res.ID, &res.UserID, &res.Title, &res.Summary, &res.FileURL, &res.CreatedAt, &res.UpdatedAt); err != nil {
			return nil, err
		}
		resumes = append(resumes, res)
	}
	return resumes, rows.Err()
}

func (r *postgresResumeRepo) Get(id string) (*models.Resume, error) {
	query := `
		SELECT id, user_id, title, COALESCE(summary, ''), COALESCE(file_url, ''), created_at, updated_at
		FROM resumes
		WHERE id = $1`
	var res models.Resume
	err := r.db.QueryRow(query, id).Scan(&res.ID, &res.UserID, &res.Title, &res.Summary, &res.FileURL, &res.CreatedAt, &res.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &res, nil
}

func (r *postgresResumeRepo) Create(res models.Resume) error {
	query := `
		INSERT INTO resumes (id, user_id, title, summary, file_url, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(query, res.ID, res.UserID, res.Title, res.Summary, res.FileURL, res.CreatedAt, res.UpdatedAt)
	return err
}

func (r *postgresResumeRepo) Delete(id string) error {
	query := `DELETE FROM resumes WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *postgresResumeRepo) Count() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM resumes`).Scan(&count)
	return count, err
}
