package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/mail"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// allowedProfileSettings are the preference switches the profile settings page stores
var allowedProfileSettings = map[string]bool{
	"notify_job_alerts":    true,
	"notify_app_status":    true,
	"notify_chat_messages": true,
	"notify_telegram":      true,
	"profile_public":       true,
	"phone_verified_only":  true,
	"push_notifications":   true,
	"email_notifications":  true,
	"notify_messages":      true,
	"notify_promos":        true,
	"sound_enabled":        true,
	"vibration_enabled":    true,
	"incognito_resume":     true,
	"two_factor_auth":      true,
	"biometrics_enabled":   true,
	"dark_mode":            true,
	"accent_color":         true,
	"theme_mode":           true,
	"language":             true,
	"font_scale":           true,
	"corner_radius":        true,
}

func resolveUserID(c *gin.Context) string {
	if userID, ok := c.Get("user_id"); ok && userID != nil {
		if s, ok := userID.(string); ok && s != "" {
			return s
		}
	}
	// Fallback to primary registered user (Yusuf Usmonov or first user) for mobile emulator/preview sync
	if userRepo != nil {
		if u, err := userRepo.GetByEmail("usmonovyusuf693@gmail.com"); err == nil && u != nil {
			return u.ID
		}
		list, err := userRepo.List()
		if err == nil && len(list) > 0 {
			return list[0].ID
		}
	}
	return ""
}

// userWantsNotification reports whether the user left the given notification switch on.
// Missing settings default to enabled.
func userWantsNotification(userID, key string) bool {
	if profileRepo == nil || userID == "" {
		return true
	}
	p, err := profileRepo.GetByUserID(userID)
	if err != nil || p == nil || len(p.Settings) == 0 {
		return true
	}
	var settings map[string]interface{}
	if json.Unmarshal(p.Settings, &settings) != nil {
		return true
	}
	val, ok := settings[key]
	if !ok {
		return true
	}
	if b, ok := val.(bool); ok {
		return b
	}
	return true
}

func GetProfile(c *gin.Context) {
	uid := resolveUserID(c)
	if uid == "" {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var userObj *models.User
	if userRepo != nil {
		userObj, _ = userRepo.GetByID(uid)
	}

	var profileObj *models.Profile
	if profileRepo != nil {
		profileObj, _ = profileRepo.GetByUserID(uid)
	}

	if profileObj == nil {
		now := time.Now().UTC()
		profileObj = &models.Profile{
			ID:        uuid.NewString(),
			UserID:    uid,
			CreatedAt: now,
			UpdatedAt: now,
			Settings:  json.RawMessage("{}"),
		}
	}

	name := "Yusuf Usmonov"
	email := "usmonovyusuf693@gmail.com"
	role := "user"
	avatar := profileObj.AvatarURL
	accountType := "individual"
	oneidVerified := true

	if userObj != nil {
		name = userObj.Name
		email = userObj.Email
		role = userObj.Role
		if avatar == "" {
			avatar = userObj.AvatarURL
		}
		if userObj.AccountType != "" {
			accountType = userObj.AccountType
		}
		oneidVerified = userObj.PINFL != "" || userObj.AuthProvider == "oneid"
	}

	parsedSettings := make(map[string]interface{})
	if len(profileObj.Settings) > 0 {
		_ = json.Unmarshal(profileObj.Settings, &parsedSettings)
	}

	response.Success(c, http.StatusOK, gin.H{
		"profile":        profileObj,
		"user":           userObj,
		"id":             uid,
		"user_id":        uid,
		"name":           name,
		"email":          email,
		"role":           role,
		"account_type":   accountType,
		"avatar_url":     avatar,
		"bio":            profileObj.Bio,
		"skills":         profileObj.Skills,
		"phone":          profileObj.Phone,
		"location":       profileObj.Location,
		"website":        profileObj.Website,
		"oneid_verified": oneidVerified,
		"settings":       parsedSettings,
	})
}

func UpdateProfile(c *gin.Context) {
	uid := resolveUserID(c)
	if uid == "" {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	// Pointer fields: a field omitted from the request keeps its stored value, so
	// partial updates (e.g. saving only skills) never wipe the rest of the profile.
	var payload struct {
		Name        *string                 `json:"name"`
		Email       *string                 `json:"email"`
		Bio         *string                 `json:"bio"`
		Skills      *string                 `json:"skills"`
		Phone       *string                 `json:"phone"`
		Location    *string                 `json:"location"`
		Website     *string                 `json:"website"`
		AvatarURL   *string                 `json:"avatar_url"`
		AccountType *string                 `json:"account_type"`
		CompanyName *string                 `json:"company_name"`
		INN         *string                 `json:"inn"`
		Settings    *map[string]interface{} `json:"settings"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	str := func(p *string) string {
		if p == nil {
			return ""
		}
		return strings.TrimSpace(*p)
	}
	trimmedName := str(payload.Name)
	trimmedEmail := strings.ToLower(str(payload.Email))

	if payload.Name != nil && trimmedName == "" {
		response.Error(c, http.StatusBadRequest, "Ism bo‘sh bo‘lishi mumkin emas")
		return
	}

	if trimmedEmail != "" {
		if addr, err := mail.ParseAddress(trimmedEmail); err != nil || addr.Address != trimmedEmail {
			response.Error(c, http.StatusBadRequest, "Noto‘g‘ri email formati")
			return
		}
		if userRepo != nil {
			existingUser, err := userRepo.GetByEmail(trimmedEmail)
			if err == nil && existingUser != nil && existingUser.ID != uid {
				response.Error(c, http.StatusConflict, "Bu email boshqa hisob tomonidan band qilingan")
				return
			}
		}
	}

	if payload.AvatarURL != nil && !isSafeLink(*payload.AvatarURL) {
		response.Error(c, http.StatusBadRequest, "Noto‘g‘ri rasm manzili")
		return
	}

	now := time.Now().UTC()
	profile := models.Profile{
		ID:        uuid.NewString(),
		UserID:    uid,
		CreatedAt: now,
	}
	if profileRepo != nil {
		existing, err := profileRepo.GetByUserID(uid)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if existing != nil {
			profile = *existing
		}
	}
	if payload.Bio != nil {
		profile.Bio = *payload.Bio
	}
	if payload.Skills != nil {
		profile.Skills = *payload.Skills
	}
	if payload.Phone != nil {
		profile.Phone = str(payload.Phone)
	}
	if payload.Location != nil {
		profile.Location = str(payload.Location)
	}
	if payload.Website != nil {
		profile.Website = str(payload.Website)
	}
	if payload.AvatarURL != nil {
		profile.AvatarURL = str(payload.AvatarURL)
	}
	if payload.Settings != nil {
		mergedSettings := make(map[string]interface{})
		if len(profile.Settings) > 0 {
			_ = json.Unmarshal(profile.Settings, &mergedSettings)
		}
		for key, val := range *payload.Settings {
			mergedSettings[key] = val
		}
		raw, _ := json.Marshal(mergedSettings)
		profile.Settings = raw
	}
	profile.UpdatedAt = now

	if profileRepo != nil {
		if err := profileRepo.Upsert(profile); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update profile")
			return
		}
	}

	avatar := str(payload.AvatarURL)
	if userRepo != nil {
		if trimmedName != "" || trimmedEmail != "" || avatar != "" {
			if err := userRepo.Update(uid, trimmedName, trimmedEmail, avatar); err != nil {
				response.Error(c, http.StatusInternalServerError, "failed to update user")
				return
			}
		}
		if payload.AccountType != nil {
			accType := str(payload.AccountType)
			if accType == "" {
				accType = "individual"
			}
			compName := str(payload.CompanyName)
			innNum := str(payload.INN)
			role := "user"
			if accType == "company" {
				role = "employer"
			}
			if r, ok := c.Get("role"); ok && r == "admin" {
				role = "admin"
			}
			_ = userRepo.UpdateAccountType(uid, accType, compName, innNum, role)
		}
	} else {
		for key, u := range users {
			if u.ID == uid {
				if trimmedName != "" {
					u.Name = trimmedName
				}
				if avatar != "" {
					u.AvatarURL = avatar
				}
				if trimmedEmail != "" && trimmedEmail != key {
					// in-memory users are keyed by email
					delete(users, key)
					u.Email = trimmedEmail
					key = trimmedEmail
				}
				if payload.AccountType != nil {
					accType := str(payload.AccountType)
					if accType == "" {
						accType = "individual"
					}
					u.AccountType = accType
					u.CompanyName = str(payload.CompanyName)
					u.INN = str(payload.INN)
					if accType == "company" && u.CompanyName != "" {
						u.Name = u.CompanyName
					}
					if u.Role != "admin" {
						if accType == "company" {
							u.Role = "employer"
						} else {
							u.Role = "user"
						}
					}
				}
				users[key] = u
				break
			}
		}
	}

	var updatedUser *models.User
	if userRepo != nil {
		updatedUser, _ = userRepo.GetByID(uid)
	} else {
		for _, u := range users {
			if u.ID == uid {
				userCopy := u
				updatedUser = &userCopy
				break
			}
		}
	}
	if updatedUser != nil && updatedUser.AccountType == "company" && strings.TrimSpace(updatedUser.CompanyName) != "" {
		updatedUser.Name = strings.TrimSpace(updatedUser.CompanyName)
	}

	retSettings := make(map[string]interface{})
	if len(profile.Settings) > 0 {
		_ = json.Unmarshal(profile.Settings, &retSettings)
	}

	response.Success(c, http.StatusOK, gin.H{
		"profile":        profile,
		"user":           updatedUser,
		"id":             uid,
		"user_id":        uid,
		"name":           trimmedName,
		"email":          trimmedEmail,
		"bio":            profile.Bio,
		"skills":         profile.Skills,
		"phone":          profile.Phone,
		"location":       profile.Location,
		"website":        profile.Website,
		"avatar_url":     profile.AvatarURL,
		"settings":       retSettings,
		"oneid_verified": true,
	})
}

// GetSettings returns only the user preferences / settings
func GetSettings(c *gin.Context) {
	uid := resolveUserID(c)
	if uid == "" {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	settings := make(map[string]interface{})
	if profileRepo != nil {
		if p, err := profileRepo.GetByUserID(uid); err == nil && p != nil && len(p.Settings) > 0 {
			_ = json.Unmarshal(p.Settings, &settings)
		}
	}
	response.Success(c, http.StatusOK, gin.H{"settings": settings})
}

// UpdateSettings stores user preferences
func UpdateSettings(c *gin.Context) {
	uid := resolveUserID(c)
	if uid == "" {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var payload struct {
		Settings map[string]interface{} `json:"settings"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	now := time.Now().UTC()
	var profile models.Profile
	if profileRepo != nil {
		existing, err := profileRepo.GetByUserID(uid)
		if err == nil && existing != nil {
			profile = *existing
		} else {
			profile = models.Profile{
				ID:        uuid.NewString(),
				UserID:    uid,
				CreatedAt: now,
			}
		}

		merged := make(map[string]interface{})
		if len(profile.Settings) > 0 {
			_ = json.Unmarshal(profile.Settings, &merged)
		}
		for k, v := range payload.Settings {
			merged[k] = v
		}
		raw, _ := json.Marshal(merged)
		profile.Settings = raw
		profile.UpdatedAt = now
		_ = profileRepo.Upsert(profile)

		response.Success(c, http.StatusOK, gin.H{"settings": merged})
		return
	}

	response.Success(c, http.StatusOK, gin.H{"settings": payload.Settings})
}

// isSafeLink allows empty values, site-relative upload paths and http(s) URLs only.
func isSafeLink(raw string) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true
	}
	if strings.HasPrefix(raw, "/uploads/") && !strings.Contains(raw, "..") {
		return true
	}
	lower := strings.ToLower(raw)
	return strings.HasPrefix(lower, "https://") || strings.HasPrefix(lower, "http://")
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

	ext, err := validateAvatar(file)
	if err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
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
