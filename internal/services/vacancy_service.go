package services

import (
    "fmt"
    "time"

    "github.com/Yusuf2236/workhub/backend/internal/models"
)

type VacancyService struct{}

func (s *VacancyService) Create(title, company, location, description, salary string) (*models.Vacancy, error) {
    if title == "" || company == "" {
        return nil, fmt.Errorf("title and company are required")
    }

    vacancy := &models.Vacancy{
        Title:       title,
        Company:     company,
        Location:    location,
        Description: description,
        Salary:      salary,
        CreatedAt:   time.Now().UTC(),
        UpdatedAt:   time.Now().UTC(),
    }

    return vacancy, nil
}
