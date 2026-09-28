package models

import "time"

type Vacancy struct {
	ID            string    `json:"id"`
	Title         string    `json:"title"`
	Company       string    `json:"company"`
	Location      string    `json:"location,omitempty"`
	Description   string    `json:"description,omitempty"`
	Salary        string    `json:"salary,omitempty"`
	Category      string    `json:"category,omitempty"`
	JobType       string    `json:"job_type,omitempty"`
	Experience    string    `json:"experience,omitempty"`
	Tags          string    `json:"tags,omitempty"`
	CompanyLogo   string    `json:"company_logo,omitempty"`
	IsVerified    bool      `json:"is_verified"`
	IsFeatured    bool      `json:"is_featured"`
	ViewsCount    int       `json:"views_count"`
	CommentsCount int       `json:"comments_count"`
	Source        string    `json:"source,omitempty"`
	CreatedBy     string    `json:"created_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at,omitempty"`
}
