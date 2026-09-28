package repositories

import (
	"database/sql"
	"errors"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type SubscriptionRepo interface {
	GetByUserID(userID string) (*models.Subscription, error)
	Create(s models.Subscription) error
	Update(s models.Subscription) error
}

type postgresSubscriptionRepo struct {
	db *sql.DB
}

func NewPostgresSubscriptionRepo(db *sql.DB) SubscriptionRepo {
	return &postgresSubscriptionRepo{db: db}
}

func (r *postgresSubscriptionRepo) GetByUserID(userID string) (*models.Subscription, error) {
	query := `
		SELECT id, user_id, plan, status, amount, currency, expires_at, created_at, updated_at
		FROM subscriptions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1`
	var s models.Subscription
	err := r.db.QueryRow(query, userID).Scan(
		&s.ID, &s.UserID, &s.Plan, &s.Status, &s.Amount, &s.Currency, &s.ExpiresAt, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *postgresSubscriptionRepo) Create(s models.Subscription) error {
	query := `
		INSERT INTO subscriptions (id, user_id, plan, status, amount, currency, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err := r.db.Exec(query, s.ID, s.UserID, s.Plan, s.Status, s.Amount, s.Currency, s.ExpiresAt, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *postgresSubscriptionRepo) Update(s models.Subscription) error {
	query := `
		UPDATE subscriptions
		SET plan = $1, status = $2, amount = $3, expires_at = $4, updated_at = $5
		WHERE id = $6`
	_, err := r.db.Exec(query, s.Plan, s.Status, s.Amount, s.ExpiresAt, s.UpdatedAt, s.ID)
	return err
}
