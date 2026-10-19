package handlers

import (
	"errors"
	"fmt"
	"io"
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

var applicationStatusLabels = map[string]string{
	"submitted": "Yuborildi",
	"reviewing": "Ko‘rib chiqilmoqda",
	"interview": "Suhbatga taklif qilindi",
	"accepted":  "Qabul qilindi",
	"rejected":  "Rad etildi",
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

// ListReceivedApplications returns applications sent to vacancies the caller posted.
func ListReceivedApplications(c *gin.Context) {
	userID := currentUserID(c)
	if applicationRepo != nil {
		items, err := applicationRepo.ListForVacancyOwner(userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query applications")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"applications": items})
		return
	}

	items := make([]models.Application, 0)
	for _, app := range applications {
		if v, ok := vacancies[app.VacancyID]; ok && v.CreatedBy != "" && v.CreatedBy == userID {
			app.VacancyTitle = v.Title
			app.VacancyCompany = v.Company
			items = append(items, app)
		}
	}
	response.Success(c, http.StatusOK, gin.H{"applications": items})
}

const maxCoverLetterLen = 5000

func ApplyToVacancy(c *gin.Context) {
	vacancyID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	// The body is optional: an empty request applies without a letter or resume
	var payload struct {
		ResumeID    string `json:"resume_id"`
		CoverLetter string `json:"cover_letter"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil && !errors.Is(err, io.EOF) {
		response.Error(c, http.StatusBadRequest, "invalid request body")
		return
	}
	payload.CoverLetter = strings.TrimSpace(payload.CoverLetter)
	payload.ResumeID = strings.TrimSpace(payload.ResumeID)
	if len([]rune(payload.CoverLetter)) > maxCoverLetterLen {
		response.Error(c, http.StatusBadRequest, "Kuzatuv xati juda uzun (maksimum 5000 belgi)")
		return
	}
	if payload.ResumeID != "" {
		resume, err := findResume(payload.ResumeID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if resume == nil || resume.UserID != userID.(string) {
			response.Error(c, http.StatusBadRequest, "Tanlangan rezyume topilmadi")
			return
		}
	}

	var vacancy *models.Vacancy
	if vacancyRepo != nil {
		v, err := vacancyRepo.Get(vacancyID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		vacancy = v
	} else if v, exists := vacancies[vacancyID]; exists {
		vacancy = &v
	}
	if vacancy == nil {
		response.Error(c, http.StatusNotFound, "vacancy not found")
		return
	}
	if vacancy.CreatedBy == "" && vacancy.SourceURL != "" {
		// Imported vacancies have no employer on WZone to read the application
		response.Error(c, http.StatusBadRequest, "Bu vakansiyaga "+vacancy.Source+" saytida ariza topshiriladi")
		return
	}
	if vacancy.CreatedBy != "" && vacancy.CreatedBy == userID.(string) {
		response.Error(c, http.StatusBadRequest, "O‘zingiz joylagan vakansiyaga ariza topshira olmaysiz")
		return
	}

	// Prevent duplicate applications to the same vacancy
	if applicationRepo != nil {
		exists, err := applicationRepo.Exists(userID.(string), vacancyID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if exists {
			response.Error(c, http.StatusConflict, "Siz bu vakansiyaga allaqachon ariza topshirgansiz")
			return
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
		ID:             uuid.NewString(),
		UserID:         userID.(string),
		VacancyID:      vacancyID,
		ResumeID:       payload.ResumeID,
		CoverLetter:    payload.CoverLetter,
		Status:         "submitted",
		CreatedAt:      time.Now().UTC(),
		UpdatedAt:      time.Now().UTC(),
		VacancyTitle:   vacancy.Title,
		VacancyCompany: vacancy.Company,
	}

	if applicationRepo != nil {
		if err := applicationRepo.Create(app); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to submit application")
			return
		}

		candidateName := "Nomzod"
		if userRepo != nil {
			if u, _ := userRepo.GetByID(userID.(string)); u != nil && u.Name != "" {
				candidateName = u.Name
			}
		}

		// In-app notifications to the candidate and to the employer who posted the vacancy
		if notificationRepo != nil {
			if userWantsNotification(userID.(string), "notify_app_status") {
				_ = notificationRepo.Create(models.Notification{
					ID:        uuid.NewString(),
					UserID:    userID.(string),
					Title:     "Ariza topshirildi",
					Body:      fmt.Sprintf("«%s» vakansiyasiga arizangiz qabul qilindi.", vacancy.Title),
					CreatedAt: time.Now().UTC(),
				})
			}
			if vacancy.CreatedBy != "" && userWantsNotification(vacancy.CreatedBy, "notify_app_status") {
				_ = notificationRepo.Create(models.Notification{
					ID:        uuid.NewString(),
					UserID:    vacancy.CreatedBy,
					Title:     "Yangi ariza",
					Body:      fmt.Sprintf("%s «%s» vakansiyangizga ariza topshirdi.", candidateName, vacancy.Title),
					CreatedAt: time.Now().UTC(),
				})
			}
		}

		// Initialize hh.uz style direct chat thread for this application
		if chatRepo != nil {
			initMsg := models.ChatMessage{
				ID:           uuid.NewString(),
				RoomID:       fmt.Sprintf("app_%s", app.ID),
				UserID:       userID.(string),
				SenderName:   candidateName,
				Content:      fmt.Sprintf("Assalomu alaykum! Men «%s» vakansiyasiga o‘z rezyume (CV)imni yubordim.", vacancy.Title),
				CreatedAt:    time.Now().UTC(),
			}
			_ = chatRepo.SaveMessage(initMsg)

			if payload.CoverLetter != "" {
				letterMsg := models.ChatMessage{
					ID:           uuid.NewString(),
					RoomID:       fmt.Sprintf("app_%s", app.ID),
					UserID:       userID.(string),
					SenderName:   candidateName,
					Content:      fmt.Sprintf("Kuzatuv xati: %s", payload.CoverLetter),
					CreatedAt:    time.Now().UTC().Add(time.Millisecond * 500),
				}
				_ = chatRepo.SaveMessage(letterMsg)
			}
		}

		vacTitle, compName := vacancy.Title, vacancy.Company
		go services.GetTelegramService().NotifyNewApplication(candidateName, vacTitle, compName)
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
		if notificationRepo != nil && userWantsNotification(existing.UserID, "notify_app_status") {
			_ = notificationRepo.Create(models.Notification{
				ID:        uuid.NewString(),
				UserID:    existing.UserID,
				Title:     "Ariza holati yangilandi",
				Body:      fmt.Sprintf("«%s» vakansiyasiga arizangiz holati: %s", existing.VacancyTitle, applicationStatusLabels[payload.Status]),
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
