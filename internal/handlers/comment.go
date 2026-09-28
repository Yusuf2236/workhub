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

func ListVacancyComments(c *gin.Context) {
	vacancyID := c.Param("id")
	if vacancyID == "" {
		response.Error(c, http.StatusBadRequest, "vacancy id required")
		return
	}

	if commentRepo != nil {
		comments, err := commentRepo.ListByVacancy(vacancyID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query comments")
			return
		}
		response.Success(c, http.StatusOK, gin.H{
			"vacancy_id": vacancyID,
			"comments":   comments,
			"total":      len(comments),
		})
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"vacancy_id": vacancyID,
		"comments":   []models.VacancyComment{},
		"total":      0,
	})
}

func CreateVacancyComment(c *gin.Context) {
	vacancyID := c.Param("id")
	if vacancyID == "" {
		response.Error(c, http.StatusBadRequest, "vacancy id required")
		return
	}

	var payload struct {
		Content      string `json:"content" binding:"required"`
		AuthorName   string `json:"author_name"`
		AuthorAvatar string `json:"author_avatar"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, "content is required")
		return
	}

	content := strings.TrimSpace(payload.Content)
	if content == "" {
		response.Error(c, http.StatusBadRequest, "comment cannot be empty")
		return
	}

	userIDStr := ""
	if uid, ok := c.Get("user_id"); ok && uid != nil {
		userIDStr = uid.(string)
	}

	authorName := strings.TrimSpace(payload.AuthorName)
	authorAvatar := strings.TrimSpace(payload.AuthorAvatar)

	if userIDStr != "" && userRepo != nil {
		if u, _ := userRepo.GetByID(userIDStr); u != nil {
			if authorName == "" {
				authorName = u.Name
			}
			if authorAvatar == "" {
				authorAvatar = u.AvatarURL
			}
		}
		if profileRepo != nil && authorAvatar == "" {
			if p, _ := profileRepo.GetByUserID(userIDStr); p != nil && p.AvatarURL != "" {
				authorAvatar = p.AvatarURL
			}
		}
	}

	if authorName == "" {
		authorName = "WZone Nomzod"
	}

	comment := models.VacancyComment{
		ID:           uuid.NewString(),
		VacancyID:    vacancyID,
		UserID:       userIDStr,
		AuthorName:   authorName,
		AuthorAvatar: authorAvatar,
		Content:      content,
		CreatedAt:    time.Now().UTC(),
	}

	if commentRepo != nil {
		created, err := commentRepo.Create(comment)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to save comment")
			return
		}
		response.Success(c, http.StatusCreated, gin.H{"comment": created})
		return
	}

	response.Success(c, http.StatusCreated, gin.H{"comment": comment})
}
