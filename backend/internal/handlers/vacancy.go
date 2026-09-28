package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListVacancies(c *gin.Context) {
	ctx := c.Request.Context()
	search := c.Query("q")
	if search == "" {
		search = c.Query("search")
	}
	category := c.Query("category")
	location := c.Query("location")
	if location == "" {
		location = c.Query("region")
	}
	jobType := c.Query("job_type")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "15"))
	if limit < 1 || limit > 100 {
		limit = 15
	}

	cacheKey := fmt.Sprintf("vacancies:q:%s:c:%s:l:%s:t:%s:p:%d:lm:%d", search, category, location, jobType, page, limit)

	// 1. Check Redis cache
	if redisClient != nil {
		cached, err := redisClient.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			var cachedData struct {
				Vacancies []models.Vacancy `json:"vacancies"`
				Total     int              `json:"total"`
				Page      int              `json:"page"`
				Limit     int              `json:"limit"`
				HasMore   bool             `json:"has_more"`
			}
			if err := json.Unmarshal([]byte(cached), &cachedData); err == nil {
				c.Header("X-Cache", "HIT")
				response.Success(c, http.StatusOK, cachedData)
				return
			}
		}
	}

	// 2. Query PostgreSQL
	if vacancyRepo != nil {
		items, total, err := vacancyRepo.ListFiltered(search, category, location, jobType, page, limit)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
			return
		}

		hasMore := (page * limit) < total

		resData := gin.H{
			"vacancies": items,
			"total":     total,
			"page":      page,
			"limit":     limit,
			"has_more":  hasMore,
		}

		// 3. Cache in Redis with 60 second TTL
		if redisClient != nil {
			if data, err := json.Marshal(resData); err == nil {
				_ = redisClient.Set(ctx, cacheKey, data, 60*time.Second).Err()
			}
		}

		c.Header("X-Cache", "MISS")
		response.Success(c, http.StatusOK, resData)
		return
	}

	items := make([]models.Vacancy, 0, len(vacancies))
	for _, v := range vacancies {
		items = append(items, v)
	}
	response.Success(c, http.StatusOK, gin.H{
		"vacancies": items,
		"total":     len(items),
		"page":      1,
		"limit":     len(items),
		"has_more":  false,
	})
}

func GetVacancy(c *gin.Context) {
	id := c.Param("id")

	if vacancyRepo != nil {
		v, err := vacancyRepo.Get(id)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query vacancy")
			return
		}
		if v == nil {
			response.Error(c, http.StatusNotFound, "vacancy not found")
			return
		}
		// Increment views in background
		go func(vacID string) {
			_ = vacancyRepo.IncrementViews(vacID)
		}(id)

		response.Success(c, http.StatusOK, gin.H{"vacancy": v})
		return
	}

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

	if strings.TrimSpace(payload.Title) == "" {
		response.Error(c, http.StatusBadRequest, "title is required")
		return
	}
	if strings.TrimSpace(payload.Company) == "" {
		payload.Company = "Maxfiy ish beruvchi"
	}

	userID, exists := c.Get("user_id")
	if exists && payload.CreatedBy == "" {
		payload.CreatedBy = userID.(string)
	}

	payload.ID = uuid.NewString()
	payload.CreatedAt = time.Now().UTC()
	payload.UpdatedAt = time.Now().UTC()
	payload.IsVerified = true
	if payload.Source == "" {
		payload.Source = "WorkHub"
	}

	if vacancyRepo != nil {
		if err := vacancyRepo.Create(payload); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to save vacancy")
			return
		}

		// Invalidate cache
		if redisClient != nil {
			keys, _ := redisClient.Keys(c.Request.Context(), "vacancies:*").Result()
			for _, k := range keys {
				_ = redisClient.Del(c.Request.Context(), k)
			}
		}
	} else {
		vacancies[payload.ID] = payload
	}

	// Broadcast newly created vacancy to Telegram channel
	services.GetTelegramService().BroadcastVacancy(&payload)

	response.Success(c, http.StatusCreated, gin.H{"vacancy": payload})
}
