package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListVacancies(c *gin.Context) {
	// ids=<uuid,...> loads specific vacancies (e.g. the user's saved list)
	if rawIDs := strings.TrimSpace(c.Query("ids")); rawIDs != "" {
		listVacanciesByIDs(c, rawIDs)
		return
	}

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
	var skills []string
	for _, sk := range strings.Split(c.Query("skills"), ",") {
		if sk = strings.TrimSpace(sk); sk != "" && len([]rune(sk)) <= 40 && len(skills) < 12 {
			skills = append(skills, sk)
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "15"))
	if limit < 1 || limit > 100 {
		limit = 15
	}

	cacheKey := fmt.Sprintf("vacancies:q:%s:c:%s:l:%s:t:%s:s:%s:p:%d:lm:%d", search, category, location, jobType, strings.Join(skills, ","), page, limit)

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
		items, total, err := vacancyRepo.ListFiltered(search, category, location, jobType, skills, page, limit)
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

	// Employers confirm their email before posting, so fake accounts cannot spam the feed.
	// Enforced only when outgoing email is configured, otherwise nobody could verify.
	if services.MailEnabled() && !isAdmin(c) && userRepo != nil {
		if u, err := userRepo.GetByID(currentUserID(c)); err == nil && u != nil && !u.EmailVerified {
			response.Error(c, http.StatusForbidden, "Vakansiya joylash uchun avval emailingizni tasdiqlang")
			return
		}
	}

	// Server-controlled fields must never come from the client
	payload.CreatedBy = currentUserID(c)
	payload.ID = uuid.NewString()
	payload.CreatedAt = time.Now().UTC()
	payload.UpdatedAt = time.Now().UTC()
	payload.ViewsCount = 0
	payload.CommentsCount = 0
	payload.Source = "WZone"
	payload.IsVerified = isAdmin(c)
	payload.IsFeatured = isAdmin(c) && payload.IsFeatured
	if !isSafeLink(payload.CompanyLogo) {
		payload.CompanyLogo = ""
	}

	if vacancyRepo != nil {
		if err := vacancyRepo.Create(payload); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to save vacancy")
			return
		}

		invalidateVacancyCache(c)
	} else {
		vacancies[payload.ID] = payload
	}

	// Broadcast newly created vacancy to Telegram channel
	services.GetTelegramService().BroadcastVacancy(&payload)

	response.Success(c, http.StatusCreated, gin.H{"vacancy": payload})
}

// invalidateVacancyCache drops cached list pages (SCAN instead of KEYS so Redis is not blocked)
func invalidateVacancyCache(c *gin.Context) {
	if redisClient == nil {
		return
	}
	ctx := c.Request.Context()
	iter := redisClient.Scan(ctx, 0, "vacancies:*", 200).Iterator()
	for iter.Next(ctx) {
		_ = redisClient.Del(ctx, iter.Val()).Err()
	}
}

const maxVacancyIDsPerRequest = 100

func listVacanciesByIDs(c *gin.Context, rawIDs string) {
	var ids []string
	seen := map[string]bool{}
	for _, id := range strings.Split(rawIDs, ",") {
		id = strings.TrimSpace(id)
		if _, err := uuid.Parse(id); err != nil || seen[id] {
			continue
		}
		seen[id] = true
		ids = append(ids, id)
		if len(ids) == maxVacancyIDsPerRequest {
			break
		}
	}

	items := []models.Vacancy{}
	if vacancyRepo != nil {
		var err error
		items, err = vacancyRepo.ListByIDs(ids)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
			return
		}
	} else {
		for _, id := range ids {
			if v, ok := vacancies[id]; ok {
				items = append(items, v)
			}
		}
	}
	response.Success(c, http.StatusOK, gin.H{
		"vacancies": items,
		"total":     len(items),
		"page":      1,
		"limit":     len(items),
		"has_more":  false,
	})
}

// ListMyVacancies returns the vacancies the caller posted.
func ListMyVacancies(c *gin.Context) {
	userID := currentUserID(c)
	items := []models.Vacancy{}
	if vacancyRepo != nil {
		var err error
		items, err = vacancyRepo.ListByCreator(userID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
			return
		}
	} else {
		for _, v := range vacancies {
			if v.CreatedBy != "" && v.CreatedBy == userID {
				items = append(items, v)
			}
		}
	}
	response.Success(c, http.StatusOK, gin.H{"vacancies": items, "total": len(items)})
}

// findOwnedVacancy loads a vacancy and checks that the caller posted it (or is an admin).
// It writes the error response itself and returns nil when the caller may not proceed.
func findOwnedVacancy(c *gin.Context) *models.Vacancy {
	id := c.Param("id")
	var v *models.Vacancy
	if vacancyRepo != nil {
		found, err := vacancyRepo.Get(id)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query vacancy")
			return nil
		}
		v = found
	} else if found, ok := vacancies[id]; ok {
		v = &found
	}
	if v == nil {
		response.Error(c, http.StatusNotFound, "vacancy not found")
		return nil
	}
	if !isAdmin(c) && (v.CreatedBy == "" || v.CreatedBy != currentUserID(c)) {
		response.Error(c, http.StatusForbidden, "Faqat vakansiya egasi uni o‘zgartira oladi")
		return nil
	}
	return v
}

func UpdateVacancy(c *gin.Context) {
	v := findOwnedVacancy(c)
	if v == nil {
		return
	}

	// Pointer fields: omitted fields keep their stored value
	var payload struct {
		Title       *string `json:"title"`
		Company     *string `json:"company"`
		Location    *string `json:"location"`
		Description *string `json:"description"`
		Salary      *string `json:"salary"`
		Category    *string `json:"category"`
		JobType     *string `json:"job_type"`
		Experience  *string `json:"experience"`
		Tags        *string `json:"tags"`
		CompanyLogo *string `json:"company_logo"`
		IsFeatured  *bool   `json:"is_featured"`
		IsVerified  *bool   `json:"is_verified"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	set := func(dst *string, src *string) {
		if src != nil {
			*dst = strings.TrimSpace(*src)
		}
	}
	set(&v.Title, payload.Title)
	set(&v.Company, payload.Company)
	set(&v.Location, payload.Location)
	set(&v.Salary, payload.Salary)
	set(&v.Category, payload.Category)
	set(&v.JobType, payload.JobType)
	set(&v.Experience, payload.Experience)
	set(&v.Tags, payload.Tags)
	if payload.Description != nil {
		v.Description = *payload.Description
	}
	if payload.CompanyLogo != nil {
		if !isSafeLink(*payload.CompanyLogo) {
			response.Error(c, http.StatusBadRequest, "Noto‘g‘ri logotip manzili")
			return
		}
		v.CompanyLogo = strings.TrimSpace(*payload.CompanyLogo)
	}
	if v.Title == "" {
		response.Error(c, http.StatusBadRequest, "title is required")
		return
	}
	if v.Company == "" {
		v.Company = "Maxfiy ish beruvchi"
	}
	// Badges are granted by moderators only
	if isAdmin(c) {
		if payload.IsFeatured != nil {
			v.IsFeatured = *payload.IsFeatured
		}
		if payload.IsVerified != nil {
			v.IsVerified = *payload.IsVerified
		}
	}
	v.UpdatedAt = time.Now().UTC()

	if vacancyRepo != nil {
		if err := vacancyRepo.Update(*v); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update vacancy")
			return
		}
		invalidateVacancyCache(c)
	} else {
		vacancies[v.ID] = *v
	}
	response.Success(c, http.StatusOK, gin.H{"vacancy": v})
}

func DeleteVacancy(c *gin.Context) {
	v := findOwnedVacancy(c)
	if v == nil {
		return
	}
	if vacancyRepo != nil {
		if err := vacancyRepo.Delete(v.ID); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to delete vacancy")
			return
		}
		invalidateVacancyCache(c)
	} else {
		delete(vacancies, v.ID)
	}
	response.Success(c, http.StatusOK, gin.H{"deleted": true, "id": v.ID})
}

// sitemapLimit matches the maximum number of URLs in one sitemap file
const sitemapLimit = 50000

// VacancySitemap lists vacancy IDs for the web app's sitemap.xml.
func VacancySitemap(c *gin.Context) {
	if vacancyRepo == nil {
		response.Success(c, http.StatusOK, gin.H{"vacancies": []any{}})
		return
	}
	entries, err := vacancyRepo.ListForSitemap(sitemapLimit)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
		return
	}
	response.Success(c, http.StatusOK, gin.H{"vacancies": entries})
}
