package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/Yusuf2236/workhub/backend/internal/models"
    "github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListApplications(c *gin.Context) {
    items := make([]models.Application, 0, len(applications))
    for _, app := range applications {
        items = append(items, app)
    }
    response.Success(c, http.StatusOK, gin.H{"applications": items})
}

func ApplyToVacancy(c *gin.Context) {
    vacancyID := c.Param("id")
    userID, _ := c.Get("user_id")

    if _, exists := vacancies[vacancyID]; !exists {
        response.Error(c, http.StatusNotFound, "vacancy not found")
        return
    }

    app := models.Application{
        ID:        uuid.NewString(),
        UserID:    userID.(string),
        VacancyID: vacancyID,
        Status:    "submitted",
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }

    applications[app.ID] = app
    response.Success(c, http.StatusCreated, gin.H{"application": app})
}

func UpdateApplicationStatus(c *gin.Context) {
    id := c.Param("id")
    app, ok := applications[id]
    if !ok {
        response.Error(c, http.StatusNotFound, "application not found")
        return
    }

    var payload struct {
        Status string `json:"status"`
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        response.Error(c, http.StatusBadRequest, err.Error())
        return
    }

    app.Status = payload.Status
    app.UpdatedAt = time.Now().UTC()
    applications[id] = app

    response.Success(c, http.StatusOK, gin.H{"application": app})
}
