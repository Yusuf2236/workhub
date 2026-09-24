package models

import "time"

type Notification struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    Title     string    `json:"title"`
    Body      string    `json:"body"`
    ReadAt    time.Time `json:"read_at,omitempty"`
    CreatedAt time.Time `json:"created_at"`
}
