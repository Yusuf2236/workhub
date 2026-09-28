package repositories

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type CommentRepo interface {
	ListByVacancy(vacancyID string) ([]models.VacancyComment, error)
	Create(c models.VacancyComment) (*models.VacancyComment, error)
	CountByVacancy(vacancyID string) (int, error)
}

type postgresCommentRepo struct {
	db *sql.DB
}

func NewPostgresCommentRepo(db *sql.DB) CommentRepo {
	return &postgresCommentRepo{db: db}
}

func (r *postgresCommentRepo) ListByVacancy(vacancyID string) ([]models.VacancyComment, error) {
	query := `
		SELECT 
			c.id, c.vacancy_id, COALESCE(c.user_id::text, ''),
			COALESCE(NULLIF(c.author_name, ''), u.name, 'Nomzod'),
			COALESCE(NULLIF(c.author_avatar, ''), p.avatar_url, u.avatar_url, ''),
			c.content, c.created_at
		FROM vacancy_comments c
		LEFT JOIN users u ON c.user_id = u.id
		LEFT JOIN profiles p ON c.user_id = p.user_id
		WHERE c.vacancy_id = $1
		ORDER BY c.created_at ASC`

	rows, err := r.db.Query(query, vacancyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := []models.VacancyComment{}
	for rows.Next() {
		var c models.VacancyComment
		if err := rows.Scan(
			&c.ID, &c.VacancyID, &c.UserID, &c.AuthorName,
			&c.AuthorAvatar, &c.Content, &c.CreatedAt,
		); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

func (r *postgresCommentRepo) Create(c models.VacancyComment) (*models.VacancyComment, error) {
	if c.ID == "" {
		c.ID = uuid.NewString()
	}
	if c.CreatedAt.IsZero() {
		c.CreatedAt = time.Now().UTC()
	}

	var uid interface{}
	if c.UserID != "" && c.UserID != "guest" {
		uid = c.UserID
	} else {
		uid = nil
	}

	query := `
		INSERT INTO vacancy_comments (id, vacancy_id, user_id, author_name, author_avatar, content, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.db.Exec(query, c.ID, c.VacancyID, uid, c.AuthorName, c.AuthorAvatar, c.Content, c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *postgresCommentRepo) CountByVacancy(vacancyID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM vacancy_comments WHERE vacancy_id = $1`
	err := r.db.QueryRow(query, vacancyID).Scan(&count)
	return count, err
}
