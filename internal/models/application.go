package models

import "time"

type Application struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	VacancyID   string    `json:"vacancy_id"`
	ResumeID    string    `json:"resume_id,omitempty"`
	CoverLetter string    `json:"cover_letter,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at,omitempty"`

	// Read-only details joined from related tables for list views
	VacancyTitle   string `json:"vacancy_title,omitempty"`
	VacancyCompany string `json:"vacancy_company,omitempty"`
	ApplicantName  string `json:"applicant_name,omitempty"`
	ApplicantEmail string `json:"applicant_email,omitempty"`
	ApplicantPhone string `json:"applicant_phone,omitempty"`
	ResumeTitle    string `json:"resume_title,omitempty"`
	ResumeSummary  string `json:"resume_summary,omitempty"`
	ResumeFileURL  string `json:"resume_file_url,omitempty"`
}
