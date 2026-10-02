package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

var errGoogleUnverified = errors.New("google token could not be verified")

// authMockEnabled allows "mock-" Google tokens for automated tests and local demos.
// It requires an explicit opt-in and is never available in production.
func authMockEnabled() bool {
	return !isProduction && os.Getenv("AUTH_MOCK_ENABLED") == "true"
}

func cleanNameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 0 || parts[0] == "" {
		return "Foydalanuvchi"
	}
	raw := parts[0]
	raw = strings.ReplaceAll(raw, ".", " ")
	raw = strings.ReplaceAll(raw, "_", " ")
	raw = strings.ReplaceAll(raw, "-", " ")
	words := strings.Fields(raw)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
		}
	}
	if len(words) == 0 {
		return "Foydalanuvchi"
	}
	return strings.Join(words, " ")
}

var googleHTTPClient = &http.Client{Timeout: 8 * time.Second}

// checkGoogleAudience ensures the token was issued for this application, so tokens
// minted for other Google apps cannot be replayed here.
func checkGoogleAudience(aud string) error {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	if clientID == "" {
		if isProduction {
			return errors.New("GOOGLE_CLIENT_ID is not configured")
		}
		return nil
	}
	if aud != clientID {
		return fmt.Errorf("token audience mismatch")
	}
	return nil
}

func fetchGoogleUserInfo(accessToken string) (string, string, string, error) {
	// 1. Verify the access token belongs to our OAuth client
	infoResp, err := googleHTTPClient.Get("https://oauth2.googleapis.com/tokeninfo?access_token=" + url.QueryEscape(accessToken))
	if err != nil {
		return "", "", "", err
	}
	defer infoResp.Body.Close()
	if infoResp.StatusCode != http.StatusOK {
		return "", "", "", errGoogleUnverified
	}
	var tokenInfo struct {
		Aud string `json:"aud"`
	}
	if err := json.NewDecoder(infoResp.Body).Decode(&tokenInfo); err != nil {
		return "", "", "", err
	}
	if err := checkGoogleAudience(tokenInfo.Aud); err != nil {
		return "", "", "", err
	}

	// 2. Fetch the profile
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return "", "", "", err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := googleHTTPClient.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("google userinfo returned %d", resp.StatusCode)
	}
	var u struct {
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return "", "", "", err
	}
	if u.Email == "" || !u.EmailVerified {
		return "", "", "", errGoogleUnverified
	}
	return u.Email, u.Name, u.Picture, nil
}

// verifyGoogleIDToken validates an ID token with Google. There is deliberately no
// fallback to decoding the JWT locally: unsigned claims are attacker-controlled.
func verifyGoogleIDToken(idToken string) (string, string, string, error) {
	resp, err := googleHTTPClient.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken))
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", "", errGoogleUnverified
	}
	var tokenInfo struct {
		Aud           string `json:"aud"`
		Email         string `json:"email"`
		EmailVerified string `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err != nil {
		return "", "", "", err
	}
	if err := checkGoogleAudience(tokenInfo.Aud); err != nil {
		return "", "", "", err
	}
	if tokenInfo.Email == "" || tokenInfo.EmailVerified != "true" {
		return "", "", "", errGoogleUnverified
	}
	return tokenInfo.Email, tokenInfo.Name, tokenInfo.Picture, nil
}

func exchangeGoogleCode(code, redirectURI string) (string, string, string, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	if clientID == "" || clientSecret == "" {
		return "", "", "", fmt.Errorf("google oauth credentials not configured in environment")
	}

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := googleHTTPClient.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("google token exchange failed: %d", resp.StatusCode)
	}

	var tokenRes struct {
		AccessToken string `json:"access_token"`
		IDToken     string `json:"id_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenRes); err != nil {
		return "", "", "", err
	}

	if tokenRes.IDToken != "" {
		if email, name, pic, err := verifyGoogleIDToken(tokenRes.IDToken); err == nil {
			return email, name, pic, nil
		}
	}
	if tokenRes.AccessToken != "" {
		return fetchGoogleUserInfo(tokenRes.AccessToken)
	}
	return "", "", "", fmt.Errorf("no tokens received from google")
}

func isPlaceholderGoogleName(name string) bool {
	return name == "" || name == "Google Foydalanuvchisi" || name == "Google Foydalanuvchi"
}

func GoogleAuth(c *gin.Context) {
	var payload struct {
		Email       string `json:"email"`
		Name        string `json:"name"`
		AvatarURL   string `json:"avatar_url"`
		Credential  string `json:"credential"`
		AccessToken string `json:"access_token"`
		Code        string `json:"code"`
		RedirectURI string `json:"redirect_uri"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var verifiedEmail, verifiedName, verifiedAvatar string

	isMock := strings.HasPrefix(payload.Credential, "mock-") || strings.HasPrefix(payload.AccessToken, "mock-") || strings.HasPrefix(payload.Code, "mock-")

	switch {
	case isMock && authMockEnabled():
		verifiedEmail = payload.Email
		verifiedName = payload.Name
		verifiedAvatar = payload.AvatarURL
	case isMock:
		// fall through to rejection below
	case payload.Credential != "":
		verifiedEmail, verifiedName, verifiedAvatar, _ = verifyGoogleIDToken(payload.Credential)
	case payload.AccessToken != "":
		verifiedEmail, verifiedName, verifiedAvatar, _ = fetchGoogleUserInfo(payload.AccessToken)
	case payload.Code != "":
		redirectURI := payload.RedirectURI
		if redirectURI == "" {
			redirectURI = "http://localhost:3000/api/auth/callback/google"
		}
		verifiedEmail, verifiedName, verifiedAvatar, _ = exchangeGoogleCode(payload.Code, redirectURI)
	}

	if verifiedEmail == "" {
		response.Error(c, http.StatusUnauthorized, "Google orqali autentifikatsiyadan o‘tish uchun haqiqiy Google token yoki kodi talab qilinadi")
		return
	}

	email := strings.ToLower(strings.TrimSpace(verifiedEmail))
	name := strings.TrimSpace(verifiedName)
	if isPlaceholderGoogleName(name) {
		name = cleanNameFromEmail(email)
	}
	avatarURL := verifiedAvatar

	var user *models.User
	if userRepo != nil {
		existing, err := userRepo.GetByEmail(email)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if existing != nil {
			needsNameUpdate := !isPlaceholderGoogleName(name) && existing.Name == ""
			needsAvatarUpdate := avatarURL != "" && (existing.AvatarURL == "" || strings.Contains(existing.AvatarURL, "unsplash.com"))
			if needsNameUpdate || needsAvatarUpdate {
				if needsNameUpdate {
					existing.Name = name
				}
				if needsAvatarUpdate {
					existing.AvatarURL = avatarURL
				}
				_ = userRepo.Update(existing.ID, existing.Name, "", existing.AvatarURL)
			}
			user = existing
		} else {
			newUser := models.User{
				ID:           uuid.NewString(),
				Name:         name,
				Email:        email,
				Role:         "user",
				AuthProvider: "google",
				AvatarURL:    avatarURL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			}
			if err := userRepo.Create(newUser); err != nil {
				response.Error(c, http.StatusInternalServerError, "failed to create user")
				return
			}
			user = &newUser
		}
	} else {
		if u, ok := users[email]; ok {
			if avatarURL != "" && (u.AvatarURL == "" || strings.Contains(u.AvatarURL, "unsplash.com")) {
				u.AvatarURL = avatarURL
			}
			users[email] = u
			user = &u
		} else {
			newUser := models.User{
				ID:           uuid.NewString(),
				Name:         name,
				Email:        email,
				Role:         "user",
				AuthProvider: "google",
				AvatarURL:    avatarURL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			}
			users[email] = newUser
			user = &newUser
		}
	}

	token, err := jwt.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"user":     user,
		"token":    token,
		"provider": "google",
	})
}
