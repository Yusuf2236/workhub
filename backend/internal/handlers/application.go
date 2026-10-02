package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var allowedApplicationStatuses = map[string]bool{
	"submitted": true,
	"reviewing": true,
	"interview": true,
	"accepted":  true,
	"rejected":  true,
}

// ListApplications returns the caller's own applications (admins see all).
func ListApplications(c *gin.Context) {
	userID := currentUserID(c)
	if applicationRepo != nil {
		var items []models.Application
		var err error
		if isAdmin(c) {
			items, err = applicationRepo.List()
		} else {
			items, err = applicationRepo.ListByUser(userID)
		}
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query applications")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"applications": items})
		return
	}

	items := make([]models.Application, 0, len(applications))
	for _, app := range applications {
		if isAdmin(c) || app.UserID == userID {
			items = append(items, app)
		}
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
		if v.CreatedBy != "" && v.CreatedBy == userID.(string) {
			response.Error(c, http.StatusBadRequest, "O‘zingiz joylagan vakansiyaga ariza topshira olmaysiz")
			return
		}
	} else {
		if _, exists := vacancies[vacancyID]; !exists {
			response.Error(c, http.StatusNotFound, "vacancy not found")
			return
		}
	}

	// Prevent duplicate applications to the same vacancy
	if applicationRepo != nil {
		existing, err := applicationRepo.ListByUser(userID.(string))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		for _, a := range existing {
			if a.VacancyID == vacancyID {
				response.Error(c, http.StatusConflict, "Siz bu vakansiyaga allaqachon ariza topshirgansiz")
				return
			}
		}
	} else {
		for _, a := range applications {
			if a.UserID == userID.(string) && a.VacancyID == vacancyID {
				response.Error(c, http.StatusConflict, "Siz bu vakansiyaga allaqachon ariza topshirgansiz")
				return
			}
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
			compName := "WZone Ish beruvchi"
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
	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	if !allowedApplicationStatuses[payload.Status] {
		response.Error(c, http.StatusBadRequest, "invalid application status")
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

		// Only the employer who posted the vacancy (or an admin) may change the status
		if !isAdmin(c) {
			v, err := vacancyRepo.Get(existing.VacancyID)
			if err != nil {
				response.Error(c, http.StatusInternalServerError, "database error")
				return
			}
			if v == nil || v.CreatedBy == "" || v.CreatedBy != currentUserID(c) {
				response.Error(c, http.StatusForbidden, "only the vacancy owner can update this application")
				return
			}
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
				Title:     "Ariza holati yangilandi",
				Body:      fmt.Sprintf("Arizangiz holati yangilandi: %s", payload.Status),
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
	if !isAdmin(c) {
		v, exists := vacancies[app.VacancyID]
		if !exists || v.CreatedBy == "" || v.CreatedBy != currentUserID(c) {
			response.Error(c, http.StatusForbidden, "only the vacancy owner can update this application")
			return
		}
	}

	app.Status = payload.Status
	app.UpdatedAt = time.Now().UTC()
	applications[id] = app

	response.Success(c, http.StatusOK, gin.H{"application": app})
}
