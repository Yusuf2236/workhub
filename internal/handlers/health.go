package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/Yusuf2236/workhub/backend/pkg/response"
)

func Health(c *gin.Context) {
    response.Success(c, http.StatusOK, gin.H{
        "status":    "ok",
        "service":   "workhub-api",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
    })
}
