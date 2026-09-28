package models

import "time"

type Application struct {
    ID        string    `json:"id"`
    UserID    string    `json:"user_id"`
    VacancyID string    `json:"vacancy_id"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at,omitempty"`
}
