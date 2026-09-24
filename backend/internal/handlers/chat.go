package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

func Health(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status":    "ok",
		"service":   "workhub-api",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func ChatHealth(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{
		"status": "chat-enabled",
		"upgrade": "websocket",
		"endpoint": "/api/v1/ws",
		"room": "default",
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
