package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ListResumes returns the caller's resumes, or the candidate database when
// all=true. The route requires authentication.
func ListResumes(c *gin.Context) {
	userID, ok := c.Get("user_id")
	showAll := c.Query("all") == "true"

	if resumeRepo != nil {
		var items []models.Resume
		var err error
		if ok && userID.(string) != "" && !showAll {
			items, err = resumeRepo.ListByUser(userID.(string))
		} else {
			items, err = resumeRepo.ListAll()
		}

		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query resumes")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"resumes": redactForViewer(c, items)})
		return
	}

	items := make([]models.Resume, 0, len(resumes))
	for _, r := range resumes {
		if ok && !showAll && r.UserID != userID.(string) {
			continue
		}
		items = append(items, r)
	}
	response.Success(c, http.StatusOK, gin.H{"resumes": redactForViewer(c, items)})
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

	if userRepo != nil && ok && userID.(string) != "" {
		u, err := userRepo.GetByID(userID.(string))
		if err == nil && u != nil && (u.AccountType == "company" || u.Role == "employer") {
			response.Error(c, http.StatusForbidden, "Kompaniya va tashkilot nomidan rezyume yaratib bo'lmaydi. Kompaniyalar faqat bo'sh ish o'rinlari (vakansiya) e'lon qila oladi.")
			return
		}
	}

	if !isSafeResumeURL(payload.FileURL) {
		response.Error(c, http.StatusBadRequest, "file_url must be an http(s) link or an uploaded file")
		return
	}

	payload.ID = uuid.NewString()
	payload.UserID = userID.(string)
	payload.CreatedAt = time.Now().UTC()
	payload.UpdatedAt = time.Now().UTC()

	if resumeRepo != nil {
		if err := resumeRepo.Create(payload); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to save resume")
			return
		}
	} else {
		resumes[payload.ID] = payload
	}

	response.Success(c, http.StatusCreated, gin.H{"resume": payload})
}

func UploadResumeFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "file is required (form-data key: 'file')")
		return
	}

	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if userRepo != nil && ok && userID.(string) != "" {
		u, err := userRepo.GetByID(userID.(string))
		if err == nil && u != nil && (u.AccountType == "company" || u.Role == "employer") {
			response.Error(c, http.StatusForbidden, "Kompaniya va tashkilot nomidan rezyume yaratib bo'lmaydi. Kompaniyalar faqat bo'sh ish o'rinlari (vakansiya) e'lon qila oladi.")
			return
		}
	}

	ext, err := validateResumeFile(file)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	// resume_id attaches the file to an existing resume instead of creating a new one
	var target *models.Resume
	if id := strings.TrimSpace(c.PostForm("resume_id")); id != "" {
		target, err = findResume(id)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query resume")
			return
		}
		if target == nil || target.UserID != userID.(string) {
			response.Error(c, http.StatusNotFound, "resume not found")
			return
		}
	}
	uniqueFilename := fmt.Sprintf("%s_%s%s", userID.(string), uuid.NewString(), ext)
	uploadDir := "./uploads/resumes"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create upload directory")
		return
	}

	dst := filepath.Join(uploadDir, uniqueFilename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to save file")
		return
	}

	fileURL := fmt.Sprintf("/uploads/resumes/%s", uniqueFilename)

	if target != nil {
		oldFile := target.FileURL
		target.FileURL = fileURL
		target.UpdatedAt = time.Now().UTC()
		if resumeRepo != nil {
			if err := resumeRepo.Update(*target); err != nil {
				_ = os.Remove(dst)
				response.Error(c, http.StatusInternalServerError, "failed to update resume")
				return
			}
		} else {
			resumes[target.ID] = *target
		}
		if strings.HasPrefix(oldFile, "/uploads/resumes/") {
			_ = os.Remove(filepath.Join(uploadDir, filepath.Base(oldFile)))
		}
		response.Success(c, http.StatusOK, gin.H{"resume": target, "file_url": fileURL})
		return
	}

	title := strings.TrimSpace(c.PostForm("title"))
	if title == "" {
		title = strings.TrimSuffix(filepath.Base(file.Filename), filepath.Ext(file.Filename))
	}
	summary := c.PostForm("summary")

	resume := models.Resume{
		ID:        uuid.NewString(),
		UserID:    userID.(string),
		Title:     title,
		Summary:   summary,
		FileURL:   fileURL,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if resumeRepo != nil {
		if err := resumeRepo.Create(resume); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to persist resume")
			return
		}
	} else {
		resumes[resume.ID] = resume
	}

	response.Success(c, http.StatusCreated, gin.H{
		"resume":   resume,
		"file_url": fileURL,
	})
}

// isSafeResumeURL rejects javascript:/data: and other schemes that would execute
// when an employer clicks the resume link.
func isSafeResumeURL(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true
	}
	if strings.HasPrefix(raw, "/uploads/resumes/") && !strings.Contains(raw, "..") {
		return true
	}
	lower := strings.ToLower(raw)
	return strings.HasPrefix(lower, "https://") || strings.HasPrefix(lower, "http://")
}

func isAdmin(c *gin.Context) bool {
	role, _ := c.Get("role")
	r, _ := role.(string)
	return r == "admin"
}

func currentUserID(c *gin.Context) string {
	uid, _ := c.Get("user_id")
	s, _ := uid.(string)
	return s
}

func findResume(id string) (*models.Resume, error) {
	if resumeRepo != nil {
		return resumeRepo.Get(id)
	}
	if r, ok := resumes[id]; ok {
		return &r, nil
	}
	return nil, nil
}

func GetResume(c *gin.Context) {
	resume, err := findResume(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query resume")
		return
	}
	if resume == nil {
		response.Error(c, http.StatusNotFound, "resume not found")
		return
	}
	if !canSeeResumeContacts(c, resume) {
		redacted := redactResume(*resume)
		resume = &redacted
	}
	response.Success(c, http.StatusOK, gin.H{"resume": resume})
}

var (
	resumeEmailPattern    = regexp.MustCompile(`[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}`)
	resumePhonePattern    = regexp.MustCompile(`\+?\d[\d\s\-()]{7,}\d`)
	resumeTelegramPattern = regexp.MustCompile(`(?i)(t\.me/|@)[A-Za-z0-9_]{4,}`)
)

// redactResume hides contact details from people browsing the candidate pool.
// They reach the candidate through the in-app chat instead; the full resume is
// shared with an employer once the candidate applies to their vacancy.
func redactResume(r models.Resume) models.Resume {
	summary := resumeEmailPattern.ReplaceAllString(r.Summary, "[email yashirilgan]")
	summary = resumePhonePattern.ReplaceAllStringFunc(summary, func(match string) string {
		// Year ranges like "2019 - 2023" also match the pattern; phones have 9+ digits
		digits := 0
		for _, ch := range match {
			if ch >= '0' && ch <= '9' {
				digits++
			}
		}
		if digits < 9 {
			return match
		}
		return "[telefon yashirilgan]"
	})
	summary = resumeTelegramPattern.ReplaceAllString(summary, "[telegram yashirilgan]")
	r.Summary = summary
	r.FileURL = ""
	r.Email = ""
	r.Phone = ""
	return r
}

func isCompanyOrEmployer(c *gin.Context) bool {
	viewer := currentUserID(c)
	if viewer == "" || userRepo == nil {
		return false
	}
	u, err := userRepo.GetByID(viewer)
	if err != nil || u == nil {
		return false
	}
	return u.AccountType == "company" || u.Role == "employer"
}

// canSeeResumeContacts allows the owner, admins and employers/companies.
func canSeeResumeContacts(c *gin.Context, r *models.Resume) bool {
	viewer := currentUserID(c)
	if isAdmin(c) || (viewer != "" && r.UserID == viewer) {
		return true
	}
	if isCompanyOrEmployer(c) {
		return true
	}
	if applicationRepo == nil || viewer == "" {
		return false
	}
	received, err := applicationRepo.ListForVacancyOwner(viewer)
	if err != nil {
		return false
	}
	for _, app := range received {
		if app.ResumeID == r.ID {
			return true
		}
	}
	return false
}

func redactForViewer(c *gin.Context, items []models.Resume) []models.Resume {
	viewer := currentUserID(c)
	admin := isAdmin(c)
	isEmployer := isCompanyOrEmployer(c)

	out := make([]models.Resume, len(items))
	for i, r := range items {
		if admin || isEmployer || (viewer != "" && r.UserID == viewer) {
			r.IsLocked = false
			out[i] = r
		} else {
			redacted := redactResume(r)
			redacted.IsLocked = true
			out[i] = redacted
		}
	}
	return out
}

func UpdateResume(c *gin.Context) {
	resume, err := findResume(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query resume")
		return
	}
	if resume == nil {
		response.Error(c, http.StatusNotFound, "resume not found")
		return
	}
	if resume.UserID != currentUserID(c) && !isAdmin(c) {
		response.Error(c, http.StatusForbidden, "you can only edit your own resumes")
		return
	}

	var payload struct {
		Title   *string `json:"title"`
		Summary *string `json:"summary"`
		FileURL *string `json:"file_url"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	if payload.Title != nil {
		if strings.TrimSpace(*payload.Title) == "" {
			response.Error(c, http.StatusBadRequest, "title is required")
			return
		}
		resume.Title = strings.TrimSpace(*payload.Title)
	}
	if payload.Summary != nil {
		resume.Summary = *payload.Summary
	}
	if payload.FileURL != nil {
		if !isSafeResumeURL(*payload.FileURL) {
			response.Error(c, http.StatusBadRequest, "file_url must be an http(s) link or an uploaded file")
			return
		}
		resume.FileURL = strings.TrimSpace(*payload.FileURL)
	}
	resume.UpdatedAt = time.Now().UTC()

	if resumeRepo != nil {
		if err := resumeRepo.Update(*resume); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update resume")
			return
		}
	} else {
		resumes[resume.ID] = *resume
	}
	response.Success(c, http.StatusOK, gin.H{"resume": resume})
}

func DeleteResume(c *gin.Context) {
	resume, err := findResume(c.Param("id"))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query resume")
		return
	}
	if resume == nil {
		response.Error(c, http.StatusNotFound, "resume not found")
		return
	}
	if resume.UserID != currentUserID(c) && !isAdmin(c) {
		response.Error(c, http.StatusForbidden, "you can only delete your own resumes")
		return
	}

	if resumeRepo != nil {
		if err := resumeRepo.Delete(resume.ID); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to delete resume")
			return
		}
	} else {
		delete(resumes, resume.ID)
	}

	// Remove the uploaded file as well, if it lives in our uploads directory
	if strings.HasPrefix(resume.FileURL, "/uploads/resumes/") {
		name := filepath.Base(resume.FileURL)
		_ = os.Remove(filepath.Join("./uploads/resumes", name))
	}

	response.Success(c, http.StatusOK, gin.H{"deleted": true, "id": resume.ID})
}
