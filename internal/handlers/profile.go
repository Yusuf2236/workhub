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

func GetProfile(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if profileRepo != nil {
		profile, err := profileRepo.GetByUserID(userID.(string))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if profile != nil {
			response.Success(c, http.StatusOK, gin.H{"profile": profile})
			return
		}
	}

	// Default empty profile
	response.Success(c, http.StatusOK, gin.H{
		"profile": gin.H{
			"user_id":    userID,
			"bio":        "",
			"skills":     "",
			"phone":      "",
			"location":   "",
			"website":    "",
			"avatar_url": "",
		},
	})
}

func UpdateProfile(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var payload struct {
		Name      string `json:"name"`
		Email     string `json:"email"`
		Bio       string `json:"bio"`
		Skills    string `json:"skills"`
		Phone     string `json:"phone"`
		Location  string `json:"location"`
		Website   string `json:"website"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	trimmedName := strings.TrimSpace(payload.Name)
	trimmedEmail := strings.ToLower(strings.TrimSpace(payload.Email))

	if trimmedEmail != "" {
		if !strings.Contains(trimmedEmail, "@") {
			response.Error(c, http.StatusBadRequest, "Noto‘g‘ri email formati")
			return
		}
		if userRepo != nil {
			existingUser, err := userRepo.GetByEmail(trimmedEmail)
			if err == nil && existingUser != nil && existingUser.ID != userID.(string) {
				response.Error(c, http.StatusConflict, "Bu email boshqa hisob tomonidan band qilingan")
				return
			}
		}
	}

	now := time.Now().UTC()
	profile := models.Profile{
		ID:        uuid.NewString(),
		UserID:    userID.(string),
		Bio:       payload.Bio,
		Skills:    payload.Skills,
		Phone:     payload.Phone,
		Location:  payload.Location,
		Website:   payload.Website,
		AvatarURL: payload.AvatarURL,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if profileRepo != nil {
		if err := profileRepo.Upsert(profile); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update profile")
			return
		}
	}

	if userRepo != nil {
		if trimmedName != "" || trimmedEmail != "" || payload.AvatarURL != "" {
			_ = userRepo.Update(userID.(string), trimmedName, trimmedEmail, payload.AvatarURL)
		}
	} else {
		for email, u := range users {
			if u.ID == userID.(string) {
				if trimmedName != "" {
					u.Name = trimmedName
				}
				if trimmedEmail != "" {
					u.Email = trimmedEmail
				}
				if payload.AvatarURL != "" {
					u.AvatarURL = payload.AvatarURL
				}
				users[email] = u
				break
			}
		}
	}

	var updatedUser *models.User
	if userRepo != nil {
		updatedUser, _ = userRepo.GetByID(userID.(string))
	} else {
		for _, u := range users {
			if u.ID == userID.(string) {
				userCopy := u
				updatedUser = &userCopy
				break
			}
		}
	}

	response.Success(c, http.StatusOK, gin.H{
		"profile": profile,
		"user":    updatedUser,
	})
}

func UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "avatar file is required (form-data key: 'avatar')")
		return
	}

	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	uniqueFilename := fmt.Sprintf("avatar_%s_%s%s", userID.(string), uuid.NewString()[:8], ext)
	uploadDir := "./uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to create avatars directory")
		return
	}

	dst := filepath.Join(uploadDir, uniqueFilename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to save avatar file")
		return
	}

	avatarURL := fmt.Sprintf("/uploads/avatars/%s", uniqueFilename)

	// Update avatar in profile
	if profileRepo != nil {
		p, _ := profileRepo.GetByUserID(userID.(string))
		if p == nil {
			p = &models.Profile{
				ID:        uuid.NewString(),
				UserID:    userID.(string),
				CreatedAt: time.Now().UTC(),
			}
		}
		p.AvatarURL = avatarURL
		p.UpdatedAt = time.Now().UTC()
		_ = profileRepo.Upsert(*p)
	}

	// Update user's avatar_url in users table as well
	if userRepo != nil {
		_ = userRepo.Update(userID.(string), "", "", avatarURL)
	}

	response.Success(c, http.StatusOK, gin.H{
		"avatar_url": avatarURL,
	})
}
