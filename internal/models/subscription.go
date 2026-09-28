package models

import "time"

type Subscription struct {
	ID        string     `json:"id"`
	UserID    string     `json:"user_id"`
	Plan      string     `json:"plan"`
	Status    string     `json:"status"`
	Amount    float64    `json:"amount"`
	Currency  string     `json:"currency"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}
