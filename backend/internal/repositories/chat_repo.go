package repositories

import "github.com/Yusuf2236/workhub/backend/internal/models"

type ChatRepo interface {
    SaveMessage(msg models.ChatMessage) error
    ListByRoom(roomID string) ([]models.ChatMessage, error)
}
