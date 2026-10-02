package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
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
		response.Success(c, http.StatusOK, gin.H{"resumes": items})
		return
	}

	items := make([]models.Resume, 0, len(resumes))
	for _, r := range resumes {
		if ok && !showAll && r.UserID != userID.(string) {
			continue
		}
		items = append(items, r)
	}
	response.Success(c, http.StatusOK, gin.H{"resumes": items})
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

	ext, err := validateResumeFile(file)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
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
	response.Success(c, http.StatusOK, gin.H{"resume": resume})
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
