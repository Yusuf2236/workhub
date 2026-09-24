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

func ListVacancies(c *gin.Context) {
    items := make([]models.Vacancy, 0, len(vacancies))
    for _, v := range vacancies {
        items = append(items, v)
    }
    response.Success(c, http.StatusOK, gin.H{"vacancies": items})
}

func GetVacancy(c *gin.Context) {
    id := c.Param("id")
    for _, v := range vacancies {
        if v.ID == id {
            response.Success(c, http.StatusOK, gin.H{"vacancy": v})
            return
        }
    }
    response.Error(c, http.StatusNotFound, "vacancy not found")
}

func CreateVacancy(c *gin.Context) {
    var payload models.Vacancy
    if err := c.ShouldBindJSON(&payload); err != nil {
        response.Error(c, http.StatusBadRequest, err.Error())
        return
    }

    if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Company) == "" {
        response.Error(c, http.StatusBadRequest, "title and company are required")
        return
    }

    payload.ID = uuid.NewString()
    payload.CreatedAt = time.Now().UTC()
    payload.UpdatedAt = time.Now().UTC()
    vacancies[payload.ID] = payload

    response.Success(c, http.StatusCreated, gin.H{"vacancy": payload})
}
