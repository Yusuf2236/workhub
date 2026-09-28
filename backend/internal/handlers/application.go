package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListApplications(c *gin.Context) {
	if applicationRepo != nil {
		items, err := applicationRepo.List()
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query applications")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"applications": items})
		return
	}

	items := make([]models.Application, 0, len(applications))
	for _, app := range applications {
		items = append(items, app)
	}
	response.Success(c, http.StatusOK, gin.H{"applications": items})
}

func ApplyToVacancy(c *gin.Context) {
	vacancyID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if vacancyRepo != nil {
		v, err := vacancyRepo.Get(vacancyID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if v == nil {
			response.Error(c, http.StatusNotFound, "vacancy not found")
			return
		}
	} else {
		if _, exists := vacancies[vacancyID]; !exists {
			response.Error(c, http.StatusNotFound, "vacancy not found")
			return
		}
	}

	app := models.Application{
		ID:        uuid.NewString(),
		UserID:    userID.(string),
		VacancyID: vacancyID,
		Status:    "submitted",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if applicationRepo != nil {
		if err := applicationRepo.Create(app); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to submit application")
			return
		}

		// Trigger in-app notification to candidate
		if notificationRepo != nil {
			_ = notificationRepo.Create(models.Notification{
				ID:        uuid.NewString(),
				UserID:    userID.(string),
				Title:     "Ariza topshirildi",
				Body:      "Vakansiyaga arizangiz muvaffaqiyatli qabul qilindi.",
				CreatedAt: time.Now().UTC(),
			})
		}

		// Trigger telegram notification
		go func() {
			candidateName := "Nomzod"
			if userRepo != nil {
				if u, _ := userRepo.GetByID(userID.(string)); u != nil && u.Name != "" {
					candidateName = u.Name
				}
			}
			vacTitle := "Vakansiya"
			compName := "WorkHub Ish beruvchi"
			if vacancyRepo != nil {
				if v, _ := vacancyRepo.Get(vacancyID); v != nil {
					vacTitle = v.Title
					compName = v.Company
				}
			}
			services.GetTelegramService().NotifyNewApplication(candidateName, vacTitle, compName)
		}()
	} else {
		applications[app.ID] = app
	}

	response.Success(c, http.StatusCreated, gin.H{"application": app})
}

func UpdateApplicationStatus(c *gin.Context) {
	id := c.Param("id")

	var payload struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if applicationRepo != nil {
		existing, err := applicationRepo.Get(id)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if existing == nil {
			response.Error(c, http.StatusNotFound, "application not found")
			return
		}

		if err := applicationRepo.UpdateStatus(id, payload.Status); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update application status")
			return
		}
		existing.Status = payload.Status
		existing.UpdatedAt = time.Now().UTC()

		// Trigger notification to candidate
		if notificationRepo != nil {
			_ = notificationRepo.Create(models.Notification{
				ID:        uuid.NewString(),
				UserID:    existing.UserID,
				Title:     "Application Status Updated",
				Body:      fmt.Sprintf("Your application status has been updated to: %s", payload.Status),
				CreatedAt: time.Now().UTC(),
			})
		}

		response.Success(c, http.StatusOK, gin.H{"application": existing})
		return
	}

	app, ok := applications[id]
	if !ok {
		response.Error(c, http.StatusNotFound, "application not found")
		return
	}

	app.Status = payload.Status
	app.UpdatedAt = time.Now().UTC()
	applications[id] = app

	response.Success(c, http.StatusOK, gin.H{"application": app})
}
