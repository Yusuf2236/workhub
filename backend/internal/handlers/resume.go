package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

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

	ext := filepath.Ext(file.Filename)
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

	title := c.PostForm("title")
	if strings.TrimSpace(title) == "" {
		title = file.Filename
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
	}

	response.Success(c, http.StatusCreated, gin.H{
		"resume":   resume,
		"file_url": fileURL,
	})
}
