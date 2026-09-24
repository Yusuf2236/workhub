package models

import "time"

type ChatMessage struct {
    ID        string    `json:"id"`
    RoomID    string    `json:"room_id"`
    UserID    string    `json:"user_id"`
    Content   string    `json:"content"`
    CreatedAt time.Time `json:"created_at"`
}
