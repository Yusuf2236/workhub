package repositories

import (
	"database/sql"
	"errors"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type ApplicationRepo interface {
	List() ([]models.Application, error)
	ListByUser(userID string) ([]models.Application, error)
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

func (r *postgresApplicationRepo) List() ([]models.Application, error) {
	query := `
		SELECT id, user_id, vacancy_id, status, created_at, updated_at
		FROM applications
		ORDER BY created_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	apps := []models.Application{}
	for rows.Next() {
		var a models.Application
		if err := rows.Scan(&a.ID, &a.UserID, &a.VacancyID, &a.Status, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func (r *postgresApplicationRepo) ListByUser(userID string) ([]models.Application, error) {
	query := `
		SELECT id, user_id, vacancy_id, status, created_at, updated_at
		FROM applications
		WHERE user_id = $1
		ORDER BY created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	apps := []models.Application{}
	for rows.Next() {
		var a models.Application
		if err := rows.Scan(&a.ID, &a.UserID, &a.VacancyID, &a.Status, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, rows.Err()
}

func (r *postgresApplicationRepo) Get(id string) (*models.Application, error) {
	query := `
		SELECT id, user_id, vacancy_id, status, created_at, updated_at
		FROM applications
		WHERE id = $1`
	var a models.Application
	err := r.db.QueryRow(query, id).Scan(&a.ID, &a.UserID, &a.VacancyID, &a.Status, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

func (r *postgresApplicationRepo) Create(app models.Application) error {
	query := `
		INSERT INTO applications (id, user_id, vacancy_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(query, app.ID, app.UserID, app.VacancyID, app.Status, app.CreatedAt, app.UpdatedAt)
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
