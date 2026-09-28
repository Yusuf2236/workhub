package repositories

import (
	"database/sql"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type NotificationRepo interface {
	ListByUser(userID string) ([]models.Notification, error)
	Create(n models.Notification) error
	MarkAsRead(id, userID string) error
	CountUnread(userID string) (int, error)
}

type postgresNotificationRepo struct {
	db *sql.DB
}

func NewPostgresNotificationRepo(db *sql.DB) NotificationRepo {
	return &postgresNotificationRepo{db: db}
}

func (r *postgresNotificationRepo) ListByUser(userID string) ([]models.Notification, error) {
	query := `
		SELECT id, user_id, title, body, read_at, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Title, &n.Body, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, rows.Err()
}

func (r *postgresNotificationRepo) Create(n models.Notification) error {
	query := `
		INSERT INTO notifications (id, user_id, title, body, read_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(query, n.ID, n.UserID, n.Title, n.Body, n.ReadAt, n.CreatedAt)
	return err
}

func (r *postgresNotificationRepo) MarkAsRead(id, userID string) error {
	query := `UPDATE notifications SET read_at = $1 WHERE id = $2 AND user_id = $3`
	_, err := r.db.Exec(query, time.Now().UTC(), id, userID)
	return err
}

func (r *postgresNotificationRepo) CountUnread(userID string) (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read_at IS NULL`, userID).Scan(&count)
	return count, err
}
