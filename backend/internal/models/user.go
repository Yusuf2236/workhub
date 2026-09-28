package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Password     string    `json:"-"`
	Role         string    `json:"role"`
	AuthProvider string    `json:"auth_provider,omitempty"`
	ExternalID   string    `json:"external_id,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	PINFL        string    `json:"pinfl,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at,omitempty"`
}

