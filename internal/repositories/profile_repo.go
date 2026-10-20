package repositories

import (
	"database/sql"
	"errors"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type ProfileRepo interface {
	GetByUserID(userID string) (*models.Profile, error)
	Upsert(p models.Profile) error
}

type postgresProfileRepo struct {
	db *sql.DB
}

func NewPostgresProfileRepo(db *sql.DB) ProfileRepo {
	return &postgresProfileRepo{db: db}
}

func (r *postgresProfileRepo) GetByUserID(userID string) (*models.Profile, error) {
	query := `
		SELECT id, user_id, COALESCE(bio, ''), COALESCE(skills, ''), COALESCE(phone, ''),
		       COALESCE(location, ''), COALESCE(website, ''), COALESCE(avatar_url, ''),
		       COALESCE(settings, '{}'::jsonb), created_at, updated_at
		FROM profiles
		WHERE user_id = $1`
	var p models.Profile
	var settings []byte
	err := r.db.QueryRow(query, userID).Scan(
		&p.ID, &p.UserID, &p.Bio, &p.Skills, &p.Phone,
		&p.Location, &p.Website, &p.AvatarURL, &settings, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	p.Settings = settings
	return &p, nil
}

func (r *postgresProfileRepo) Upsert(p models.Profile) error {
	query := `
		INSERT INTO profiles (id, user_id, bio, skills, phone, location, website, avatar_url, settings, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
		ON CONFLICT (user_id) DO UPDATE
		SET bio = EXCLUDED.bio,
		    skills = EXCLUDED.skills,
		    phone = EXCLUDED.phone,
		    location = EXCLUDED.location,
		    website = EXCLUDED.website,
		    avatar_url = EXCLUDED.avatar_url,
		    settings = EXCLUDED.settings,
		    updated_at = EXCLUDED.updated_at`
	settings := string(p.Settings)
	if settings == "" {
		settings = "{}"
	}
	_, err := r.db.Exec(query, p.ID, p.UserID, p.Bio, p.Skills, p.Phone, p.Location, p.Website, p.AvatarURL, settings, p.CreatedAt, p.UpdatedAt)
	return err
}
