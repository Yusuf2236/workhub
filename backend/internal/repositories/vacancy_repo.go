package repositories

import "github.com/Yusuf2236/workhub/backend/internal/models"

type VacancyRepo interface {
    List() ([]models.Vacancy, error)
    Get(id string) (*models.Vacancy, error)
    Create(v models.Vacancy) error
    Update(v models.Vacancy) error
    Delete(id string) error
}
