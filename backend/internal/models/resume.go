package models

import "time"

type Resume struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    Title     string    `json:"title"`
    Summary   string    `json:"summary,omitempty"`
    FileURL   string    `json:"file_url,omitempty"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at,omitempty"`
}
