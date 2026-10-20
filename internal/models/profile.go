package models

import (
	"encoding/json"
	"time"
)

type Profile struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Bio       string `json:"bio"`
	Skills    string `json:"skills,omitempty"`
	Phone     string `json:"phone,omitempty"`
	Location  string `json:"location"`
	Website   string `json:"website"`
	AvatarURL string `json:"avatar_url"`
	// Settings holds notification/privacy preferences as a JSON object
	Settings  json.RawMessage `json:"settings,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}
