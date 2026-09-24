package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/gorilla/websocket"
    "github.com/Yusuf2236/workhub/backend/pkg/response"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool { return true },
}

func ChatHealth(c *gin.Context) {
    response.Success(c, http.StatusOK, gin.H{
        "status":    "chat-enabled",
        "endpoint":  "/api/v1/ws",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    })
}

func HandleChatSocket(c *gin.Context) {
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    if err != nil {
        response.Error(c, http.StatusBadRequest, "failed to upgrade websocket connection")
        return
    }
    defer conn.Close()

    roomID := c.Query("room")
    if roomID == "" {
        roomID = "default"
    }

    for {
        _, msg, err := conn.ReadMessage()
        if err != nil {
            return
        }

        payload := gin.H{
            "id":        uuid.NewString(),
            "room_id":   roomID,
            "content":   string(msg),
            "created_at": time.Now().UTC().Format(time.RFC3339),
        }

        if err := conn.WriteJSON(payload); err != nil {
            return
        }
    }
}
