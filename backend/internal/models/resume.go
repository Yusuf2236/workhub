package models

import "time"

type Resume struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Summary   string    `json:"summary,omitempty"`
	FileURL   string    `json:"file_url,omitempty"`
	IsLocked  bool      `json:"is_locked"`
	FullName  string    `json:"full_name,omitempty"`
	Email     string    `json:"email,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	Location  string    `json:"location,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}
