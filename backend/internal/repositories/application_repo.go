package repositories

import "github.com/Yusuf2236/workhub/backend/internal/models"

type ApplicationRepo interface {
    List() ([]models.Application, error)
    Get(id string) (*models.Application, error)
    Create(app models.Application) error
    UpdateStatus(id, status string) error
}
