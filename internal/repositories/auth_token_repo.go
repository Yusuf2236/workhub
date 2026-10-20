package repositories

import (
	"database/sql"
	"errors"
	"time"
)

// AuthTokenRepo stores one-time email links (email verification, password reset).
// Only a hash of each token is kept, so a database leak does not expose usable links.
type AuthTokenRepo interface {
	Create(id, userID, kind, tokenHash string, expiresAt time.Time) error
	// Consume marks a valid, unused, unexpired token as used and returns its user ID.
	// ok is false when no such token exists.
	Consume(kind, tokenHash string) (userID string, ok bool, err error)
}

type postgresAuthTokenRepo struct {
	db *sql.DB
}

func NewPostgresAuthTokenRepo(db *sql.DB) AuthTokenRepo {
	return &postgresAuthTokenRepo{db: db}
}

func (r *postgresAuthTokenRepo) Create(id, userID, kind, tokenHash string, expiresAt time.Time) error {
	// A new link replaces older unused ones of the same kind
	if _, err := r.db.Exec(`UPDATE auth_tokens SET used_at = NOW() WHERE user_id = $1 AND kind = $2 AND used_at IS NULL`, userID, kind); err != nil {
		return err
	}
	_, err := r.db.Exec(`INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)`,
		id, userID, kind, tokenHash, expiresAt)
	return err
}

func (r *postgresAuthTokenRepo) Consume(kind, tokenHash string) (string, bool, error) {
	var userID string
	err := r.db.QueryRow(`
		UPDATE auth_tokens SET used_at = NOW()
		WHERE kind = $1 AND token_hash = $2 AND used_at IS NULL AND expires_at > NOW()
		RETURNING user_id::text`, kind, tokenHash).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return userID, true, nil
}
