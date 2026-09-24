package services

import (
    "fmt"
    "time"
)

type NotificationService struct {
    ProjectID string
}

func NewNotificationService(projectID string) *NotificationService {
    return &NotificationService{ProjectID: projectID}
}

func (s *NotificationService) SendPush(deviceToken, message string) error {
    if deviceToken == "" || message == "" {
        return fmt.Errorf("device token and message are required")
    }

    // Replace with Firebase Admin SDK call in production.
    _ = time.Now()
    return nil
}
