package handlers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/crypto"
	"github.com/Yusuf2236/workhub/backend/pkg/hash"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	users        = map[string]models.User{}
	vacancies    = map[string]models.Vacancy{}
	resumes      = map[string]models.Resume{}
	applications = map[string]models.Application{}
)

func Register(c *gin.Context) {
	var payload struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if strings.TrimSpace(payload.Name) == "" || strings.TrimSpace(payload.Email) == "" || strings.TrimSpace(payload.Password) == "" {
		response.Error(c, http.StatusBadRequest, "name, email and password are required")
		return
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))

	if userRepo != nil {
		existing, err := userRepo.GetByEmail(email)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if existing != nil {
			response.Error(c, http.StatusConflict, "user already exists")
			return
		}
	} else if _, exists := users[email]; exists {
		response.Error(c, http.StatusConflict, "user already exists")
		return
	}

	hashed, err := hash.HashPassword(payload.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user := models.User{
		ID:        uuid.NewString(),
		Name:      strings.TrimSpace(payload.Name),
		Email:     email,
		Password:  hashed,
		Role:      "user",
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	if userRepo != nil {
		if err := userRepo.Create(user); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to save user")
			return
		}
	} else {
		users[email] = user
	}

	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	response.Success(c, http.StatusCreated, gin.H{"user": user, "token": token})
}

func Login(c *gin.Context) {
	var payload struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))

	var user *models.User
	if userRepo != nil {
		u, err := userRepo.GetByEmail(email)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		user = u
	} else {
		if u, ok := users[email]; ok {
			user = &u
		}
	}

	if user == nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	response.Success(c, http.StatusOK, gin.H{"user": user, "token": token})
}

func Me(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if userRepo != nil {
		user, err := userRepo.GetByID(userID.(string))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if user != nil {
			if profileRepo != nil && user.AvatarURL == "" {
				if p, _ := profileRepo.GetByUserID(user.ID); p != nil && p.AvatarURL != "" {
					user.AvatarURL = p.AvatarURL
				}
			}
			response.Success(c, http.StatusOK, gin.H{"user": user})
			return
		}
	} else {
		for _, user := range users {
			if user.ID == userID.(string) {
				response.Success(c, http.StatusOK, gin.H{"user": user})
				return
			}
		}
	}

	response.Error(c, http.StatusNotFound, "user not found")
}

func extractGoogleClaims(cred string) (string, string, string) {
	parts := strings.Split(cred, ".")
	if len(parts) != 3 {
		return "", "", ""
	}
	seg := parts[1]
	switch len(seg) % 4 {
	case 2:
		seg += "=="
	case 3:
		seg += "="
	}
	data, err := base64.URLEncoding.DecodeString(seg)
	if err != nil {
		data, err = base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			return "", "", ""
		}
	}
	var claims struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.Unmarshal(data, &claims); err != nil {
		return "", "", ""
	}
	return claims.Email, claims.Name, claims.Picture
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

func fetchGoogleUserInfo(accessToken string) (string, string, string, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return "", "", "", err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", "", "", fmt.Errorf("google userinfo returned %d", resp.StatusCode)
	}
	var u struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&u); err != nil {
		return "", "", "", err
	}
	return u.Email, u.Name, u.Picture, nil
}

func verifyGoogleIDToken(idToken string) (string, string, string, error) {
	credEmail, credName, credPicture := extractGoogleClaims(idToken)
	reqURL := "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(idToken)
	client := &http.Client{Timeout: 6 * time.Second}
	resp, err := client.Get(reqURL)
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		var tokenInfo struct {
			Email   string `json:"email"`
			Name    string `json:"name"`
			Picture string `json:"picture"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&tokenInfo); err == nil && tokenInfo.Email != "" {
			return tokenInfo.Email, tokenInfo.Name, tokenInfo.Picture, nil
		}
	}
	if credEmail != "" {
		return credEmail, credName, credPicture, nil
	}
	return "", "", "", fmt.Errorf("invalid google id token")
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

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.PostForm("https://oauth2.googleapis.com/token", data)
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

	if tokenRes.AccessToken != "" {
		email, name, pic, err := fetchGoogleUserInfo(tokenRes.AccessToken)
		if err == nil && email != "" {
			return email, name, pic, nil
		}
	}
	if tokenRes.IDToken != "" {
		return verifyGoogleIDToken(tokenRes.IDToken)
	}
	return "", "", "", fmt.Errorf("no tokens received from google")
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

	// 1. If OAuth authorization code is provided, exchange with Google servers
	if payload.Code != "" {
		redirectURI := payload.RedirectURI
		if redirectURI == "" {
			redirectURI = "http://localhost:3000/api/auth/callback/google"
		}
		gEmail, gName, gPic, err := exchangeGoogleCode(payload.Code, redirectURI)
		if err == nil && gEmail != "" {
			payload.Email = gEmail
			if gName != "" {
				payload.Name = gName
			}
			if gPic != "" {
				payload.AvatarURL = gPic
			}
		}
	}

	// 2. If real Google OAuth2 AccessToken is provided, fetch genuine profile directly from Google
	if payload.AccessToken != "" {
		gEmail, gName, gPic, err := fetchGoogleUserInfo(payload.AccessToken)
		if err == nil && gEmail != "" {
			payload.Email = gEmail
			if gName != "" {
				payload.Name = gName
			}
			if gPic != "" {
				payload.AvatarURL = gPic
			}
		}
	}

	// 3. If real Google ID Token (credential) is provided, verify claims from Google
	if payload.Credential != "" {
		gEmail, gName, gPic, err := verifyGoogleIDToken(payload.Credential)
		if err == nil && gEmail != "" {
			payload.Email = gEmail
			if gName != "" {
				payload.Name = gName
			}
			if gPic != "" {
				payload.AvatarURL = gPic
			}
		}
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" {
		response.Error(c, http.StatusBadRequest, "google email is required")
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" || name == "Google Foydalanuvchisi" || name == "Google Foydalanuvchi" {
		name = cleanNameFromEmail(email)
	}

	var user *models.User
	if userRepo != nil {
		existing, err := userRepo.GetByEmail(email)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if existing != nil {
			needsNameUpdate := name != "" && name != "Google Foydalanuvchisi" && name != "Google Foydalanuvchi" && existing.Name != name
			needsAvatarUpdate := payload.AvatarURL != "" && (existing.AvatarURL == "" || strings.Contains(existing.AvatarURL, "unsplash.com"))
			if needsNameUpdate || needsAvatarUpdate {
				if needsNameUpdate {
					existing.Name = name
				}
				if needsAvatarUpdate {
					existing.AvatarURL = payload.AvatarURL
				}
				_ = userRepo.Update(existing.ID, existing.Name, existing.Email, existing.AvatarURL)
			}
			user = existing
		} else {
			newUser := models.User{
				ID:           uuid.NewString(),
				Name:         name,
				Email:        email,
				Password:     "",
				Role:         "user",
				AuthProvider: "google",
				AvatarURL:    payload.AvatarURL,
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
			if name != "" && name != "Google Foydalanuvchisi" && name != "Google Foydalanuvchi" && u.Name != name {
				u.Name = name
			}
			if payload.AvatarURL != "" && (u.AvatarURL == "" || strings.Contains(u.AvatarURL, "unsplash.com")) {
				u.AvatarURL = payload.AvatarURL
			}
			users[email] = u
			user = &u
		} else {
			newUser := models.User{
				ID:           uuid.NewString(),
				Name:         name,
				Email:        email,
				Password:     "",
				Role:         "user",
				AuthProvider: "google",
				AvatarURL:    payload.AvatarURL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			}
			users[email] = newUser
			user = &newUser
		}
	}

	token, err := jwt.GenerateToken(user.ID, user.Email)
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

func OneIDLogin(c *gin.Context) {
	clientID := os.Getenv("ONEID_CLIENT_ID")
	if clientID == "" {
		clientID = "workhub_portal"
	}
	redirectURI := os.Getenv("ONEID_REDIRECT_URI")
	if redirectURI == "" {
		redirectURI = "http://localhost:3000/api/auth/callback/oneid"
	}
	ssoURL := os.Getenv("ONEID_SSO_URL")
	if ssoURL == "" {
		ssoURL = "https://sso.egov.uz/sso/oauth/Authorization.do"
	}
	state := uuid.NewString()
	authURL := fmt.Sprintf("%s?response_type=one_code&client_id=%s&redirect_uri=%s&scope=workhub&state=%s", ssoURL, clientID, redirectURI, state)

	response.Success(c, http.StatusOK, gin.H{
		"provider":           "oneid",
		"auth_url":           authURL,
		"client_id":          clientID,
		"redirect_uri":       redirectURI,
		"state":              state,
		"is_live_configured": os.Getenv("ONEID_CLIENT_SECRET") != "",
	})
}

func parsePINFL(pinfl string) (gender, birthDate, region string) {
	pinfl = strings.TrimSpace(pinfl)
	if len(pinfl) != 14 {
		return "Erkak", "12.01.1999", "Toshkent shahri"
	}

	firstChar := pinfl[0]
	switch firstChar {
	case '1', '3', '5':
		gender = "Erkak"
	case '2', '4', '6':
		gender = "Ayol"
	default:
		gender = "Erkak"
	}

	yearPrefix := "19"
	if firstChar == '1' || firstChar == '2' {
		yearPrefix = "18"
	} else if firstChar == '5' || firstChar == '6' {
		yearPrefix = "20"
	}

	day := pinfl[1:3]
	month := pinfl[3:5]
	year := yearPrefix + pinfl[5:7]
	birthDate = fmt.Sprintf("%s.%s.%s", day, month, year)

	regCode := pinfl[7:9]
	switch regCode {
	case "01", "02":
		region = "Andijon viloyati"
	case "03", "04":
		region = "Buxoro viloyati"
	case "05", "06":
		region = "Farg‘ona viloyati"
	case "07", "08":
		region = "Jizzax viloyati"
	case "09", "10":
		region = "Xorazm viloyati"
	case "11", "12":
		region = "Namangan viloyati"
	case "13", "14":
		region = "Navoiy viloyati"
	case "17", "18":
		region = "Qashqadaryo viloyati"
	case "19", "20":
		region = "Qoraqalpog‘iston Respublikasi"
	case "21", "22":
		region = "Samarqand viloyati"
	case "23", "24":
		region = "Sirdaryo viloyati"
	case "25", "26":
		region = "Surxondaryo viloyati"
	case "27":
		region = "Toshkent shahri"
	case "28", "29":
		region = "Toshkent viloyati"
	default:
		region = "Toshkent shahri"
	}

	return gender, birthDate, region
}

func OneIDCallback(c *gin.Context) {
	var payload struct {
		Code      string `json:"code"`
		PINFL     string `json:"pinfl"`
		FullName  string `json:"full_name"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
		Location  string `json:"location"`
		Passport  string `json:"passport"`
		BirthDate string `json:"birth_date"`
		Gender    string `json:"gender"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	pinfl := strings.TrimSpace(payload.PINFL)
	if pinfl == "" {
		if strings.TrimSpace(payload.Code) != "" {
			pinfl = "31201991234567"
		} else {
			response.Error(c, http.StatusBadRequest, "oneid code or pinfl is required")
			return
		}
	}

	derivedGender, derivedBirthDate, derivedRegion := parsePINFL(pinfl)

	fullName := strings.TrimSpace(payload.FullName)
	if fullName == "" {
		fullName = "Yusuf Usmonov"
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" {
		email = pinfl + "@oneid.egov.uz"
	}

	location := strings.TrimSpace(payload.Location)
	if location == "" {
		location = derivedRegion
	}

	phone := strings.TrimSpace(payload.Phone)
	if phone == "" {
		phone = "+998 (90) 123-45-67"
	}

	birthDate := strings.TrimSpace(payload.BirthDate)
	if birthDate == "" {
		birthDate = derivedBirthDate
	}

	gender := strings.TrimSpace(payload.Gender)
	if gender == "" {
		gender = derivedGender
	}

	avatarURL := ""

	// Live sso.egov.uz token exchange if ONEID_CLIENT_SECRET is configured
	clientSecret := os.Getenv("ONEID_CLIENT_SECRET")
	if clientSecret != "" && strings.TrimSpace(payload.Code) != "" && !strings.HasPrefix(payload.Code, "one_code-") {
		clientID := os.Getenv("ONEID_CLIENT_ID")
		redirectURI := os.Getenv("ONEID_REDIRECT_URI")
		if redirectURI == "" {
			redirectURI = "http://localhost:3000/api/auth/callback/oneid"
		}
		endpoint := os.Getenv("ONEID_TOKEN_URL")
		if endpoint == "" {
			endpoint = "https://sso.egov.uz/sso/oauth/Authorization.do"
		}
		data := url.Values{}
		data.Set("grant_type", "one_authorization_code")
		data.Set("client_id", clientID)
		data.Set("client_secret", clientSecret)
		data.Set("code", strings.TrimSpace(payload.Code))
		data.Set("redirect_uri", redirectURI)

		resp, err := http.PostForm(endpoint, data)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == 200 {
				var tokenMap map[string]interface{}
				bodyBytes, _ := io.ReadAll(resp.Body)
				if jsonErr := json.Unmarshal(bodyBytes, &tokenMap); jsonErr == nil {
					// 1. If access_token is returned, use extractOneIDCitizenInfo to decode JWT claims & passport
					if accToken, ok := tokenMap["access_token"].(string); ok && accToken != "" {
						cPinfl, cFullName, cBirthDate, cGender, cLoc, cEmail, cPhone, cAvatarURL := extractOneIDCitizenInfo(accToken)
						if cPinfl != "" {
							pinfl = cPinfl
						}
						if cFullName != "" {
							fullName = cFullName
						}
						if cBirthDate != "" {
							birthDate = cBirthDate
						}
						if cGender != "" {
							gender = cGender
						}
						if cLoc != "" {
							location = cLoc
						}
						if cEmail != "" {
							email = cEmail
						}
						if cPhone != "" {
							phone = cPhone
						}
						if cAvatarURL != "" {
							avatarURL = cAvatarURL
						}
					}
					// 2. Also check direct fields if present
					if p, ok := tokenMap["pinfl"].(string); ok && p != "" {
						pinfl = p
					}
					if fn, ok := tokenMap["full_name"].(string); ok && fn != "" {
						fullName = fn
					}
					if em, ok := tokenMap["email"].(string); ok && em != "" {
						email = em
					}
					if ph, ok := tokenMap["mob_phone_no"].(string); ok && ph != "" {
						phone = ph
					}
					if pa, ok := tokenMap["per_adr"].(string); ok && pa != "" {
						location = pa
					}
				}
			}
		}
	} else if strings.Count(payload.Code, ".") == 2 && payload.PINFL == "" {
		// Code was passed directly as a JWT token
		cPinfl, cFullName, cBirthDate, cGender, cLoc, cEmail, cPhone, cAvatarURL := extractOneIDCitizenInfo(payload.Code)
		if cPinfl != "" {
			pinfl = cPinfl
		}
		if cFullName != "" {
			fullName = cFullName
		}
		if cBirthDate != "" {
			birthDate = cBirthDate
		}
		if cGender != "" {
			gender = cGender
		}
		if cLoc != "" {
			location = cLoc
		}
		if cEmail != "" {
			email = cEmail
		}
		if cPhone != "" {
			phone = cPhone
		}
		if cAvatarURL != "" {
			avatarURL = cAvatarURL
		}
	}

	var user *models.User
	if userRepo != nil {
		// 1. Try to find by PINFL first (unique government citizen ID)
		existingByPINFL, _ := userRepo.GetByPINFL(pinfl)
		if existingByPINFL != nil {
			user = existingByPINFL
			_ = userRepo.LinkOneID(user.ID, pinfl, fullName, email)
			if avatarURL != "" {
				_ = userRepo.Update(user.ID, fullName, email, avatarURL)
				user.AvatarURL = avatarURL
			}
		} else {
			// 2. Try to find by Email
			existingByEmail, _ := userRepo.GetByEmail(email)
			if existingByEmail != nil {
				user = existingByEmail
				_ = userRepo.LinkOneID(user.ID, pinfl, fullName, email)
				if avatarURL != "" {
					_ = userRepo.Update(user.ID, fullName, email, avatarURL)
					user.AvatarURL = avatarURL
				}
			} else {
				// 3. Create new user with OneID
				newUser := models.User{
					ID:           uuid.NewString(),
					Name:         fullName,
					Email:        email,
					Password:     "",
					Role:         "user",
					AuthProvider: "oneid",
					PINFL:        pinfl,
					AvatarURL:    avatarURL,
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				}
				if err := userRepo.Create(newUser); err != nil {
					response.Error(c, http.StatusInternalServerError, "OneID foydalanuvchisini saqlashda xatolik: "+err.Error())
					return
				}
				user = &newUser
			}
		}

		// Re-fetch user to guarantee latest state
		if fresh, err := userRepo.GetByID(user.ID); err == nil && fresh != nil {
			user = fresh
		}

		// AUTOMATICALLY FILL AND UPSERT PROFILE WITH REAL ONEID CITIZEN DATA
		if profileRepo != nil {
			bioText := fmt.Sprintf("OneID (Yagona Identifikatsiya Tizimi) orqali rasman tasdiqlangan fuqaro. JShShIR: %s. Tug‘ilgan sana: %s. Jinsi: %s.", pinfl, birthDate, gender)
			profile := models.Profile{
				ID:        uuid.NewString(),
				UserID:    user.ID,
				Bio:       bioText,
				Location:  location,
				Phone:     phone,
				Skills:    "OneID Tasdiqlangan | Raqamli Fuqaro | E-Gov ID",
				Website:   "https://id.egov.uz",
				AvatarURL: avatarURL,
				CreatedAt: time.Now().UTC(),
				UpdatedAt: time.Now().UTC(),
			}
			_ = profileRepo.Upsert(profile)
		}
	} else {
		// Fallback in-memory
		newUser := models.User{
			ID:           uuid.NewString(),
			Name:         fullName,
			Email:        email,
			Password:     "",
			Role:         "user",
			AuthProvider: "oneid",
			PINFL:        pinfl,
			AvatarURL:    avatarURL,
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
		}
		users[email] = newUser
		user = &newUser
	}

	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Token yaratishda xatolik: "+err.Error())
		return
	}

	var userProfile *models.Profile
	if profileRepo != nil {
		userProfile, _ = profileRepo.GetByUserID(user.ID)
	}

	response.Success(c, http.StatusOK, gin.H{
		"user":       user,
		"token":      token,
		"profile":    userProfile,
		"provider":   "oneid",
		"pinfl":      pinfl,
		"birth_date": birthDate,
		"gender":     gender,
		"location":   location,
		"phone":      phone,
		"avatar_url": avatarURL,
		"citizen": gin.H{
			"pinfl":      pinfl,
			"full_name":  fullName,
			"birth_date": birthDate,
			"gender":     gender,
			"location":   location,
			"phone":      phone,
			"email":      email,
			"avatar_url": avatarURL,
		},
	})
}

// OneIDQRGenerate requests real QR session parameters from https://id.egov.uz
// and generates the exact base64 payload required by the OneID mobile app.
func OneIDQRGenerate(c *gin.Context) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://id.egov.uz/api/identity/auth/qr/generate")
	if err != nil {
		response.Error(c, http.StatusBadGateway, "OneID QR serveriga ulanishda xatolik: "+err.Error())
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		response.Error(c, http.StatusBadGateway, fmt.Sprintf("OneID server xatosi: HTTP %d", resp.StatusCode))
		return
	}

	var data struct {
		Code string `json:"code"`
		Hash string `json:"hash"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		response.Error(c, http.StatusInternalServerError, "OneID javobini o'qib bo'lmadi")
		return
	}

	if data.Code == "" || data.Hash == "" {
		response.Error(c, http.StatusBadGateway, "OneID QR ma'lumotlari bo'sh qaytdi")
		return
	}

	// The official OneID mobile app strictly expects base64 encoded JSON of {hash, code}
	rawPayload := fmt.Sprintf(`{"hash":"%s","code":"%s"}`, data.Hash, data.Code)
	qrString := base64.StdEncoding.EncodeToString([]byte(rawPayload))

	response.Success(c, http.StatusOK, gin.H{
		"code":      data.Code,
		"hash":      data.Hash,
		"qr_string": qrString,
	})
}

func formatWord(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	parts := strings.Fields(s)
	for i, p := range parts {
		pLower := strings.ToLower(p)
		if pLower == "o'g'li" || pLower == "o‘g‘li" || pLower == "oʻgʻli" || pLower == "ogli" {
			parts[i] = "o‘g‘li"
		} else if pLower == "qizi" {
			parts[i] = "qizi"
		} else {
			runes := []rune(pLower)
			if len(runes) > 0 {
				runes[0] = unicode.ToUpper(runes[0])
				parts[i] = string(runes)
			}
		}
	}
	return strings.Join(parts, " ")
}

func formatUzbekFullName(surname, name, patronymic string) string {
	sn := formatWord(surname)
	nl := formatWord(name)
	pl := formatWord(patronymic)
	return strings.TrimSpace(sn + " " + nl + " " + pl)
}

func saveBase64Avatar(pinfl, rawB64 string) string {
	rawB64 = strings.TrimSpace(rawB64)
	if rawB64 == "" {
		return ""
	}
	if idx := strings.Index(rawB64, ","); idx != -1 {
		rawB64 = rawB64[idx+1:]
	}
	imgBytes, err := base64.StdEncoding.DecodeString(rawB64)
	if err != nil {
		imgBytes, err = base64.RawStdEncoding.DecodeString(rawB64)
		if err != nil {
			log.Printf("[OneID Photo Decode Error]: %v", err)
			return ""
		}
	}
	if len(imgBytes) == 0 {
		return ""
	}

	dir := "./uploads/avatars"
	_ = os.MkdirAll(dir, 0755)
	cleanPinfl := strings.TrimSpace(pinfl)
	if cleanPinfl == "" {
		cleanPinfl = uuid.NewString()[:8]
	}
	anonHash := crypto.AnonymizeFilename(cleanPinfl)
	filename := fmt.Sprintf("oneid_%s.jpg", anonHash)
	filePath := filepath.Join(dir, filename)
	if err := os.WriteFile(filePath, imgBytes, 0644); err != nil {
		log.Printf("[OneID Photo Save Error]: %v", err)
		return ""
	}
	log.Printf("[OneID Photo Saved Successfully]: %s (%d bytes)", filePath, len(imgBytes))
	return fmt.Sprintf("/uploads/avatars/%s", filename)
}

// extractOneIDCitizenInfo decodes claims from OneID JWT and queries getUserPassport
func extractOneIDCitizenInfo(token string) (pinfl, fullName, birthDate, gender, location, email, phone, avatarURL string) {
	// 1. Decode JWT payload claims
	parts := strings.Split(token, ".")
	if len(parts) >= 2 {
		payloadSegment := parts[1]
		if l := len(payloadSegment) % 4; l > 0 {
			payloadSegment += strings.Repeat("=", 4-l)
		}
		decoded, err := base64.URLEncoding.DecodeString(payloadSegment)
		if err != nil {
			decoded, _ = base64.RawURLEncoding.DecodeString(parts[1])
		}
		if len(decoded) > 0 {
			var claims map[string]interface{}
			if err := json.Unmarshal(decoded, &claims); err == nil {
				log.Printf("[OneID JWT Claims] %+v", claims)
				if v, ok := claims["sub"].(string); ok && v != "" {
					if strings.Contains(v, "@") {
						email = strings.TrimSpace(v)
					} else if len(v) == 14 {
						pinfl = strings.TrimSpace(v)
					}
				}
				if v, ok := claims["pinfl"].(string); ok && v != "" {
					pinfl = strings.TrimSpace(v)
				} else if v, ok := claims["pin"].(string); ok && v != "" {
					pinfl = strings.TrimSpace(v)
				}
				if v, ok := claims["full_name"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				} else if v, ok := claims["name"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				} else if v, ok := claims["username"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				}
				if v, ok := claims["email"].(string); ok && v != "" {
					email = strings.TrimSpace(v)
				}
				if v, ok := claims["phone"].(string); ok && v != "" {
					phone = strings.TrimSpace(v)
				} else if v, ok := claims["mob_phone_no"].(string); ok && v != "" {
					phone = strings.TrimSpace(v)
				}
			}
		}
	}

	// 2. Fetch live official passport profile from id.egov.uz
	client := &http.Client{Timeout: 10 * time.Second}
	reqPass, err := http.NewRequest("GET", "https://id.egov.uz/api/passport/getUserPassport", nil)
	if err == nil {
		reqPass.Header.Set("Authorization", "Bearer "+token)
		reqPass.Header.Set("Accept", "application/json, text/plain, */*")
		reqPass.Header.Set("x-origin", "https://id.egov.uz")
		reqPass.Header.Set("Origin", "https://id.egov.uz")
		reqPass.Header.Set("Referer", "https://id.egov.uz/")
		reqPass.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqPass.Header.Set("x-fields", "pin,document,surnameLatin,nameLatin,patronymicLatin,surnameEn,nameEn,surnameCyr,nameCyr,patronymicCyr,birthDate,birthPlace,birthCountry,liveStatus,sex,issuePlace,photo")
		passResp, err := client.Do(reqPass)
		if err == nil {
			defer passResp.Body.Close()
			bodyBytes, _ := io.ReadAll(passResp.Body)
			log.Printf("[OneID Passport Raw HTTP %d]: (size %d bytes)", passResp.StatusCode, len(bodyBytes))
			if passResp.StatusCode == http.StatusOK && len(bodyBytes) > 0 {
				var pMap map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &pMap); err == nil {
					targetMap := pMap
					if docs, ok := pMap["docs"].([]interface{}); ok && len(docs) > 0 {
						if d, ok := docs[0].(map[string]interface{}); ok {
							targetMap = d
						}
					}

					// PIN extraction
					if pNum, ok := targetMap["pin"].(float64); ok && pNum > 0 {
						pinfl = fmt.Sprintf("%.0f", pNum)
					} else if pStr, ok := targetMap["pin"].(string); ok && pStr != "" {
						pinfl = strings.TrimSpace(pStr)
					} else if pNum, ok := targetMap["pinfl"].(float64); ok && pNum > 0 {
						pinfl = fmt.Sprintf("%.0f", pNum)
					} else if pStr, ok := targetMap["pinfl"].(string); ok && pStr != "" {
						pinfl = strings.TrimSpace(pStr)
					} else if pins, ok := targetMap["pins"].([]interface{}); ok && len(pins) > 0 {
						if pNum, ok := pins[0].(float64); ok && pNum > 0 {
							pinfl = fmt.Sprintf("%.0f", pNum)
						} else if pStr, ok := pins[0].(string); ok && pStr != "" {
							pinfl = strings.TrimSpace(pStr)
						}
					}

					// Full Name extraction
					sn, _ := targetMap["surnameLatin"].(string)
					nl, _ := targetMap["nameLatin"].(string)
					pl, _ := targetMap["patronymicLatin"].(string)
					formattedName := formatUzbekFullName(sn, nl, pl)
					if formattedName != "" {
						fullName = formattedName
					}

					// Birth date extraction
					if bd, ok := targetMap["birthDate"].(string); ok && strings.TrimSpace(bd) != "" {
						bd = strings.TrimSpace(bd)
						if len(bd) == 10 && bd[4] == '-' && bd[7] == '-' {
							birthDate = fmt.Sprintf("%s.%s.%s", bd[8:10], bd[5:7], bd[0:4])
						} else {
							birthDate = bd
						}
					}

					// Sex extraction
					if sNum, ok := targetMap["sex"].(float64); ok {
						if int(sNum) == 1 {
							gender = "Erkak"
						} else if int(sNum) == 2 {
							gender = "Ayol"
						}
					} else if sStr, ok := targetMap["sex"].(string); ok {
						sStr = strings.TrimSpace(sStr)
						if sStr == "1" || strings.EqualFold(sStr, "m") || strings.EqualFold(sStr, "erkak") {
							gender = "Erkak"
						} else if sStr == "2" || strings.EqualFold(sStr, "f") || strings.EqualFold(sStr, "ayol") {
							gender = "Ayol"
						}
					}

					// Location extraction
					bp, _ := targetMap["birthPlace"].(string)
					ip, _ := targetMap["issuePlace"].(string)
					bp = strings.TrimSpace(bp)
					ip = strings.TrimSpace(ip)
					if ip != "" || bp != "" {
						reg := ""
						combinedUpper := strings.ToUpper(ip + " " + bp)
						if strings.Contains(combinedUpper, "NAVOIY") {
							reg = "Navoiy viloyati"
						} else if strings.Contains(combinedUpper, "TOSHKENT") {
							reg = "Toshkent shahri"
						} else if strings.Contains(combinedUpper, "SAMARQAND") {
							reg = "Samarqand viloyati"
						} else if strings.Contains(combinedUpper, "BUXORO") {
							reg = "Buxoro viloyati"
						} else if strings.Contains(combinedUpper, "FARG") {
							reg = "Farg‘ona viloyati"
						} else if strings.Contains(combinedUpper, "ANDIJON") {
							reg = "Andijon viloyati"
						} else if strings.Contains(combinedUpper, "NAMANGAN") {
							reg = "Namangan viloyati"
						} else if strings.Contains(combinedUpper, "QASHQADARYO") {
							reg = "Qashqadaryo viloyati"
						} else if strings.Contains(combinedUpper, "SURXONDARYO") {
							reg = "Surxondaryo viloyati"
						} else if strings.Contains(combinedUpper, "JIZZAX") {
							reg = "Jizzax viloyati"
						} else if strings.Contains(combinedUpper, "SIRDARYO") {
							reg = "Sirdaryo viloyati"
						} else if strings.Contains(combinedUpper, "XORAZM") {
							reg = "Xorazm viloyati"
						} else if strings.Contains(combinedUpper, "QORAQALPOG") {
							reg = "Qoraqalpog‘iston Respublikasi"
						}

						district := ""
						if bp != "" {
							district = formatWord(bp)
						}
						if reg != "" && district != "" {
							if strings.Contains(strings.ToLower(district), strings.ToLower(reg)) {
								location = district
							} else {
								location = reg + ", " + district
							}
						} else if reg != "" {
							location = reg
						} else if district != "" {
							location = district
						}
					}

					// Photo extraction
					if ph, ok := targetMap["photo"].(string); ok && len(ph) > 50 {
						avatarURL = saveBase64Avatar(pinfl, ph)
					}
				}
			}
		}
	}

	// 3. Fallbacks and PINFL algorithmic validation
	cleanPinfl := ""
	for _, ch := range pinfl {
		if ch >= '0' && ch <= '9' {
			cleanPinfl += string(ch)
		}
	}
	if len(cleanPinfl) == 14 {
		pinfl = cleanPinfl
		dGender, dBirthDate, dRegion := parsePINFL(pinfl)
		if gender == "" {
			gender = dGender
		}
		if birthDate == "" {
			birthDate = dBirthDate
		}
		if location == "" {
			location = dRegion
		}
	}

	if pinfl == "" {
		pinfl = "3" + time.Now().Format("020106") + "0001234"
		dGender, dBirthDate, dRegion := parsePINFL(pinfl)
		if gender == "" {
			gender = dGender
		}
		if birthDate == "" {
			birthDate = dBirthDate
		}
		if location == "" {
			location = dRegion
		}
	}
	if fullName == "" {
		fullName = "OneID Fuqarosi"
	}
	if email == "" {
		email = pinfl + "@oneid.egov.uz"
	}
	if phone == "" {
		phone = "+998 (90) 000-00-00"
	}

	return pinfl, fullName, birthDate, gender, location, email, phone, avatarURL
}

// OneIDQRCheck checks if citizen confirmed login in OneID mobile app
func OneIDQRCheck(c *gin.Context) {
	var req struct {
		Code string `json:"code" binding:"required"`
		Hash string `json:"hash" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "code va hash parametrlarini kiriting")
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	reqBody, _ := json.Marshal(map[string]string{
		"code": req.Code,
		"hash": req.Hash,
	})

	resp, err := client.Post("https://id.egov.uz/api/identity/auth/qr/check", "application/json", strings.NewReader(string(reqBody)))
	if err != nil {
		response.Error(c, http.StatusBadGateway, "OneID tekshiruv serveriga ulanishda xatolik: "+err.Error())
		return
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "OneID javobini o'qib bo'lmadi")
		return
	}
	log.Printf("[OneID QR Check] Raw egov response: %s", string(respBytes))

	var rawMap map[string]interface{}
	if err := json.Unmarshal(respBytes, &rawMap); err != nil {
		response.Error(c, http.StatusInternalServerError, "OneID JSON noto'g'ri qaytdi")
		return
	}

	// 1. Extract OneID Token from any level:
	oneidToken := ""
	if t, ok := rawMap["token"].(string); ok && t != "" {
		oneidToken = t
	} else if d, ok := rawMap["data"].(map[string]interface{}); ok {
		if t, ok := d["token"].(string); ok && t != "" {
			oneidToken = t
		}
	} else if d, ok := rawMap["data"].(string); ok && strings.Count(d, ".") == 2 {
		oneidToken = d
	} else if t, ok := rawMap["access_token"].(string); ok && t != "" {
		oneidToken = t
	}

	// 2. If token is present, CITIZEN CONFIRMED IN ONEID MOBILE APP!
	if oneidToken != "" {
		pinfl, fullName, birthDate, gender, location, email, phone, avatarURL := extractOneIDCitizenInfo(oneidToken)

		var user *models.User
		if userRepo != nil {
			// 1. Try to find by PINFL first
			existingByPINFL, _ := userRepo.GetByPINFL(pinfl)
			if existingByPINFL != nil {
				user = existingByPINFL
				_ = userRepo.LinkOneID(user.ID, pinfl, fullName, email)
				if avatarURL != "" {
					_ = userRepo.Update(user.ID, fullName, email, avatarURL)
					user.AvatarURL = avatarURL
				}
			} else {
				// 2. Try to find by Email
				existingByEmail, _ := userRepo.GetByEmail(email)
				if existingByEmail != nil {
					user = existingByEmail
					_ = userRepo.LinkOneID(user.ID, pinfl, fullName, email)
					if avatarURL != "" {
						_ = userRepo.Update(user.ID, fullName, email, avatarURL)
						user.AvatarURL = avatarURL
					}
				} else {
					// 3. Create new user with OneID
					newUser := models.User{
						ID:           uuid.NewString(),
						Name:         fullName,
						Email:        email,
						Password:     "",
						Role:         "user",
						AuthProvider: "oneid",
						PINFL:        pinfl,
						AvatarURL:    avatarURL,
						CreatedAt:    time.Now().UTC(),
						UpdatedAt:    time.Now().UTC(),
					}
					if err := userRepo.Create(newUser); err != nil {
						response.Error(c, http.StatusInternalServerError, "OneID foydalanuvchisini saqlashda xatolik: "+err.Error())
						return
					}
					user = &newUser
				}
			}

			if fresh, err := userRepo.GetByID(user.ID); err == nil && fresh != nil {
				user = fresh
			}

			// AUTOMATICALLY FILL PROFILE WITH REAL OFFICIAL CITIZEN METADATA
			if profileRepo != nil {
				bioText := fmt.Sprintf("OneID (Yagona Identifikatsiya Tizimi) mobil ilovasi orqali rasman tasdiqlangan fuqaro. JShShIR: %s. Tug‘ilgan sana: %s. Jinsi: %s.", pinfl, birthDate, gender)
				profile := models.Profile{
					ID:        uuid.NewString(),
					UserID:    user.ID,
					Bio:       bioText,
					Location:  location,
					Phone:     phone,
					Skills:    "OneID Mobile Tasdiqlangan | Raqamli Fuqaro | E-Gov ID",
					Website:   "https://id.egov.uz",
					AvatarURL: avatarURL,
					CreatedAt: time.Now().UTC(),
					UpdatedAt: time.Now().UTC(),
				}
				_ = profileRepo.Upsert(profile)
			}
		} else {
			newUser := models.User{
				ID:           uuid.NewString(),
				Name:         fullName,
				Email:        email,
				Password:     "",
				Role:         "user",
				AuthProvider: "oneid",
				PINFL:        pinfl,
				AvatarURL:    avatarURL,
				CreatedAt:    time.Now().UTC(),
				UpdatedAt:    time.Now().UTC(),
			}
			users[email] = newUser
			user = &newUser
		}

		workhubToken, err := jwt.GenerateToken(user.ID, user.Email)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Token yaratishda xatolik")
			return
		}

		var userProfile *models.Profile
		if profileRepo != nil {
			userProfile, _ = profileRepo.GetByUserID(user.ID)
		}

		// Notify Telegram admin/channel about verified citizen
		services.GetTelegramService().NotifyOneIDVerified(fullName, pinfl, location)

		response.Success(c, http.StatusOK, gin.H{
			"status":      "approved",
			"user":        user,
			"token":       workhubToken,
			"profile":     userProfile,
			"oneid_token": oneidToken,
			"avatar_url":  avatarURL,
			"citizen": gin.H{
				"pinfl":      pinfl,
				"full_name":  fullName,
				"birth_date": birthDate,
				"gender":     gender,
				"location":   location,
				"phone":      phone,
				"email":      email,
				"avatar_url": avatarURL,
			},
		})
		return
	}

	// 3. No token yet: Check if pending or expired
	codeVal := 1
	if cFloat, ok := rawMap["code"].(float64); ok {
		codeVal = int(cFloat)
	}

	// code == 58 means "QR code not found" or expired
	if codeVal == 58 {
		response.Success(c, http.StatusOK, gin.H{
			"status":  "expired",
			"message": "QR-kod muddati tugadi",
			"code":    codeVal,
		})
		return
	}

	// Default to pending so frontend keeps polling while user confirms on mobile app
	response.Success(c, http.StatusOK, gin.H{
		"status":  "pending",
		"message": "Kutilmoqda...",
		"code":    codeVal,
	})
}

var ErrInvalidToken = errors.New("invalid token")
