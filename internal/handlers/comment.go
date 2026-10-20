package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

// ListRecentComments returns the newest vacancy comments across the portal (home feed).
func ListRecentComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	if commentRepo == nil {
		response.Success(c, http.StatusOK, gin.H{"comments": []models.VacancyComment{}, "total": 0, "has_more": false})
		return
	}

	var categories []string
	if cat := strings.TrimSpace(c.Query("category")); cat != "" {
		categories = strings.Split(cat, ",")
	}
	comments, total, err := commentRepo.ListRecent(categories, limit, (page-1)*limit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query comments")
		return
	}
	response.Success(c, http.StatusOK, gin.H{
		"comments": comments,
		"total":    total,
		"page":     page,
		"has_more": page*limit < total,
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
		// Authenticated users always post under their own identity
		authorName = ""
		authorAvatar = ""
		if u, _ := userRepo.GetByID(userIDStr); u != nil {
			if u.AccountType == "company" && strings.TrimSpace(u.CompanyName) != "" {
				authorName = strings.TrimSpace(u.CompanyName)
			} else {
				authorName = u.Name
			}
			authorAvatar = u.AvatarURL
		}
		if profileRepo != nil && authorAvatar == "" {
			if p, _ := profileRepo.GetByUserID(userIDStr); p != nil && p.AvatarURL != "" {
				authorAvatar = p.AvatarURL
			}
		}
	}

	if !isSafeLink(authorAvatar) {
		authorAvatar = ""
	}
	if len([]rune(authorName)) > 80 {
		authorName = string([]rune(authorName)[:80])
	}
	if len(content) > 2000 {
		response.Error(c, http.StatusBadRequest, "comment is too long")
		return
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

	if vacancyRepo != nil {
		if v, err := vacancyRepo.Get(vacancyID); err != nil || v == nil {
			response.Error(c, http.StatusNotFound, "vacancy not found")
			return
		}
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
