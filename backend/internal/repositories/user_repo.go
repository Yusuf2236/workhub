package repositories

import "github.com/Yusuf2236/workhub/backend/internal/models"

type UserRepo interface {
    Create(user models.User) error
    GetByEmail(email string) (*models.User, error)
    GetByID(id string) (*models.User, error)
}
