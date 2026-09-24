package services

import (
    "fmt"
    "time"

    "github.com/Yusuf2236/workhub/backend/internal/models"
)

type ApplicationService struct{}

func (s *ApplicationService) Apply(userID, vacancyID string) (*models.Application, error) {
    if userID == "" || vacancyID == "" {
        return nil, fmt.Errorf("user id and vacancy id are required")
    }

    app := &models.Application{
        UserID:    userID,
        VacancyID: vacancyID,
        Status:    "submitted",
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }

    return app, nil
}
