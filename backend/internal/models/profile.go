package models

import "time"

type Profile struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Bio       string    `json:"bio"`
	Skills    string    `json:"skills,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	Location  string    `json:"location"`
	Website   string    `json:"website"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
