package repositories

import "github.com/Yusuf2236/workhub/backend/internal/models"

type ResumeRepo interface {
    ListByUser(userID string) ([]models.Resume, error)
    Create(r models.Resume) error
    Get(id string) (*models.Resume, error)
}
