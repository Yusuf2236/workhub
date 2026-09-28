package services

import (
    "fmt"
    "time"

    "github.com/Yusuf2236/workhub/backend/internal/models"
)

type ResumeService struct{}

func (s *ResumeService) Create(userID, title, summary, fileURL string) (*models.Resume, error) {
    if userID == "" || title == "" {
        return nil, fmt.Errorf("user id and title are required")
    }

    resume := &models.Resume{
        UserID:    userID,
        Title:     title,
        Summary:   summary,
        FileURL:   fileURL,
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }

    return resume, nil
}
