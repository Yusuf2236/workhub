package repositories

import (
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/crypto"
)

type UserRepo interface {
	Create(user models.User) error
	GetByEmail(email string) (*models.User, error)
	GetByID(id string) (*models.User, error)
	GetByExternalID(provider, externalID string) (*models.User, error)
	List() ([]models.User, error)
	Count() (int, error)
	Update(id string, name string, email string, avatarURL string) error
	GetByPINFL(pinfl string) (*models.User, error)
	LinkOneID(id string, pinfl string, name string, email string) error
	SetPassword(id, passwordHash string) error
	MarkEmailVerified(id string) error
	// RevokeTokens invalidates every token issued to the user before now
	RevokeTokens(id string) error
	// TokensValidAfter returns the revocation time (zero if never revoked); ok is false if the user is gone
	TokensValidAfter(id string) (t time.Time, ok bool, err error)
}

type postgresUserRepo struct {
	db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) UserRepo {
	return &postgresUserRepo{db: db}
}

func (r *postgresUserRepo) Create(u models.User) error {
	cleanPinfl := strings.TrimSpace(u.PINFL)
	encPinfl, _ := crypto.Encrypt(cleanPinfl)
	blindIdx := crypto.BlindIndex(cleanPinfl)

	query := `
		INSERT INTO users (id, name, email, password_hash, role, auth_provider, external_id, avatar_url, pinfl, pinfl_hash, email_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`
	provider := u.AuthProvider
	if provider == "" {
		provider = "local"
	}
	// Google and OneID confirm the email address themselves
	verified := u.EmailVerified || provider == "google" || provider == "oneid"
	_, err := r.db.Exec(query, u.ID, u.Name, strings.ToLower(u.Email), u.Password, u.Role, provider, u.ExternalID, u.AvatarURL, encPinfl, blindIdx, verified, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *postgresUserRepo) GetByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, name, email, COALESCE(password_hash, ''), role, COALESCE(auth_provider, 'local'),
		       COALESCE(external_id, ''), COALESCE(avatar_url, ''), COALESCE(pinfl, ''), COALESCE(email_verified, false), created_at, updated_at
		FROM users WHERE LOWER(email) = LOWER($1)`
	var u models.User
	var rawPinfl string
	err := r.db.QueryRow(query, email).Scan(
		&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.AuthProvider,
		&u.ExternalID, &u.AvatarURL, &rawPinfl, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.PINFL, _ = crypto.Decrypt(rawPinfl)
	return &u, nil
}

func (r *postgresUserRepo) GetByID(id string) (*models.User, error) {
	query := `
		SELECT id, name, email, COALESCE(password_hash, ''), role, COALESCE(auth_provider, 'local'),
		       COALESCE(external_id, ''), COALESCE(avatar_url, ''), COALESCE(pinfl, ''), COALESCE(email_verified, false), created_at, updated_at
		FROM users WHERE id = $1`
	var u models.User
	var rawPinfl string
	err := r.db.QueryRow(query, id).Scan(
		&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.AuthProvider,
		&u.ExternalID, &u.AvatarURL, &rawPinfl, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.PINFL, _ = crypto.Decrypt(rawPinfl)
	return &u, nil
}

func (r *postgresUserRepo) GetByExternalID(provider, externalID string) (*models.User, error) {
	query := `
		SELECT id, name, email, COALESCE(password_hash, ''), role, COALESCE(auth_provider, 'local'),
		       COALESCE(external_id, ''), COALESCE(avatar_url, ''), COALESCE(pinfl, ''), COALESCE(email_verified, false), created_at, updated_at
		FROM users WHERE auth_provider = $1 AND external_id = $2`
	var u models.User
	var rawPinfl string
	err := r.db.QueryRow(query, provider, externalID).Scan(
		&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.AuthProvider,
		&u.ExternalID, &u.AvatarURL, &rawPinfl, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.PINFL, _ = crypto.Decrypt(rawPinfl)
	return &u, nil
}

func (r *postgresUserRepo) List() ([]models.User, error) {
	query := `
		SELECT id, name, email, COALESCE(password_hash, ''), role, COALESCE(auth_provider, 'local'),
		       COALESCE(external_id, ''), COALESCE(avatar_url, ''), COALESCE(pinfl, ''), COALESCE(email_verified, false), created_at, updated_at
		FROM users ORDER BY created_at DESC
		LIMIT 1000`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		var u models.User
		var rawPinfl string
		if err := rows.Scan(
			&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.AuthProvider,
			&u.ExternalID, &u.AvatarURL, &rawPinfl, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, err
		}
		u.PINFL, _ = crypto.Decrypt(rawPinfl)
		users = append(users, u)
	}
	return users, rows.Err()
}

func (r *postgresUserRepo) Count() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&count)
	return count, err
}

func (r *postgresUserRepo) Update(id string, name string, email string, avatarURL string) error {
	query := `
		UPDATE users 
		SET name = CASE WHEN $2 <> '' THEN $2 ELSE name END,
		    email_verified = CASE WHEN $3 <> '' AND $3 <> LOWER(email) THEN false ELSE email_verified END,
		    email = CASE WHEN $3 <> '' THEN $3 ELSE email END,
		    avatar_url = CASE WHEN $4 <> '' THEN $4 ELSE avatar_url END,
		    updated_at = NOW()
		WHERE id = $1`
	_, err := r.db.Exec(query, id, strings.TrimSpace(name), strings.ToLower(strings.TrimSpace(email)), strings.TrimSpace(avatarURL))
	return err
}

func (r *postgresUserRepo) GetByPINFL(pinfl string) (*models.User, error) {
	clean := strings.TrimSpace(pinfl)
	if clean == "" {
		return nil, nil
	}
	blindIdx := crypto.BlindIndex(clean)

	query := `
		SELECT id, name, email, COALESCE(password_hash, ''), role, COALESCE(auth_provider, 'local'),
		       COALESCE(external_id, ''), COALESCE(avatar_url, ''), COALESCE(pinfl, ''), COALESCE(email_verified, false), created_at, updated_at
		FROM users 
		WHERE pinfl_hash = $1 OR pinfl = $2 LIMIT 1`
	var u models.User
	var rawPinfl string
	err := r.db.QueryRow(query, blindIdx, clean).Scan(
		&u.ID, &u.Name, &u.Email, &u.Password, &u.Role, &u.AuthProvider,
		&u.ExternalID, &u.AvatarURL, &rawPinfl, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u.PINFL, _ = crypto.Decrypt(rawPinfl)
	return &u, nil
}

func (r *postgresUserRepo) LinkOneID(id string, pinfl string, name string, email string) error {
	clean := strings.TrimSpace(pinfl)
	encPinfl, _ := crypto.Encrypt(clean)
	blindIdx := crypto.BlindIndex(clean)

	query := `
		UPDATE users 
		SET pinfl = $2,
		    pinfl_hash = $3,
		    auth_provider = 'oneid',
		    name = CASE WHEN $4 <> '' THEN $4 ELSE name END,
		    email = CASE WHEN $5 <> '' THEN $5 ELSE email END,
		    updated_at = NOW()
		WHERE id = $1`
	_, err := r.db.Exec(query, id, encPinfl, blindIdx, strings.TrimSpace(name), strings.ToLower(strings.TrimSpace(email)))
	return err
}

func (r *postgresUserRepo) SetPassword(id, passwordHash string) error {
	_, err := r.db.Exec(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, id, passwordHash)
	return err
}

func (r *postgresUserRepo) MarkEmailVerified(id string) error {
	_, err := r.db.Exec(`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *postgresUserRepo) RevokeTokens(id string) error {
	// JWT issue times have second precision, so revoke from the start of the current second
	_, err := r.db.Exec(`UPDATE users SET tokens_valid_after = date_trunc('second', NOW()) WHERE id = $1`, id)
	return err
}

func (r *postgresUserRepo) TokensValidAfter(id string) (time.Time, bool, error) {
	var t sql.NullTime
	err := r.db.QueryRow(`SELECT tokens_valid_after FROM users WHERE id = $1`, id).Scan(&t)
	if errors.Is(err, sql.ErrNoRows) {
		return time.Time{}, false, nil
	}
	if err != nil {
		return time.Time{}, false, err
	}
	return t.Time, true, nil
}
