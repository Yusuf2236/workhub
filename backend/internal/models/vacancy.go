package models

import "time"

type Vacancy struct {
    ID          string    `json:"id"`
    Title       string    `json:"title"`
    Company     string    `json:"company"`
    Location    string    `json:"location,omitempty"`
    Description string    `json:"description,omitempty"`
    Salary      string    `json:"salary,omitempty"`
    CreatedBy   string    `json:"created_by,omitempty"`
    CreatedAt   time.Time `json:"created_at"`
    UpdatedAt   time.Time `json:"updated_at,omitempty"`
}
