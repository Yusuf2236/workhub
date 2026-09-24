package handlers

import (
    "net/http"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/Yusuf2236/workhub/backend/internal/models"
    "github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListResumes(c *gin.Context) {
    items := make([]models.Resume, 0, len(resumes))
    for _, r := range resumes {
        items = append(items, r)
    }
    response.Success(c, http.StatusOK, gin.H{"resumes": items})
}

func CreateResume(c *gin.Context) {
    var payload models.Resume
    if err := c.ShouldBindJSON(&payload); err != nil {
        response.Error(c, http.StatusBadRequest, err.Error())
        return
    }

    if strings.TrimSpace(payload.Title) == "" {
        response.Error(c, http.StatusBadRequest, "title is required")
        return
    }

    userID, ok := c.Get("user_id")
    if !ok {
        response.Error(c, http.StatusUnauthorized, "missing user context")
        return
    }

    payload.ID = uuid.NewString()
    payload.UserID = userID.(string)
    payload.CreatedAt = time.Now().UTC()
    payload.UpdatedAt = time.Now().UTC()
    resumes[payload.ID] = payload

    response.Success(c, http.StatusCreated, gin.H{"resume": payload})
}
