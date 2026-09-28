package services

import "fmt"

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
    return nil
}
