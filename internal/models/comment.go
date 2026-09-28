package models

import "time"

type VacancyComment struct {
	ID           string    `json:"id"`
	VacancyID    string    `json:"vacancy_id"`
	UserID       string    `json:"user_id,omitempty"`
	AuthorName   string    `json:"author_name"`
	AuthorAvatar string    `json:"author_avatar,omitempty"`
	Content      string    `json:"content"`
	CreatedAt    time.Time `json:"created_at"`
}
