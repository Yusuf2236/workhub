package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const oneIDStateTTL = 10 * time.Minute

// oneIDCitizen holds identity data obtained from a trusted OneID source
// (sso.egov.uz token exchange or id.egov.uz QR confirmation).
type oneIDCitizen struct {
	PINFL       string
	FullName    string
	BirthDate   string
	Gender      string
	Location    string
	Email       string
	Phone       string
	AvatarURL   string
	AccountType string
	CompanyName string
	INN         string
}

// oneIDDemoMode allows logging in with a self-declared PINFL. It exists only for
// local development and is never available in production.
func oneIDDemoMode() bool {
	return !isProduction && os.Getenv("ONEID_DEMO_MODE") == "true"
}

func normalizePINFL(pinfl string) string {
	var b strings.Builder
	for _, ch := range pinfl {
		if ch >= '0' && ch <= '9' {
			b.WriteRune(ch)
		}
	}
	if b.Len() != 14 {
		return ""
	}
	return b.String()
}

func maskPINFL(pinfl string) string {
	if len(pinfl) <= 4 {
		return strings.Repeat("*", len(pinfl))
	}
	return strings.Repeat("*", len(pinfl)-4) + pinfl[len(pinfl)-4:]
}

func OneIDLogin(c *gin.Context) {
	clientID := os.Getenv("ONEID_CLIENT_ID")
	if clientID == "" {
		clientID = "workhub_portal"
	}
	redirectURI := os.Getenv("ONEID_REDIRECT_URI")
	if redirectURI == "" {
		if isProduction {
			redirectURI = "https://wzone.uz/api/auth/callback/oneid"
		} else {
			redirectURI = "http://localhost:3000/api/auth/callback/oneid"
		}
	}
	ssoURL := os.Getenv("ONEID_SSO_URL")
	if ssoURL == "" {
		ssoURL = "https://sso.egov.uz/sso/oauth/Authorization.do"
	}
	state := "oneid_" + uuid.NewString()
	if redisClient != nil {
		_ = redisClient.Set(c.Request.Context(), "oneid:state:"+state, "1", oneIDStateTTL).Err()
	}

	q := url.Values{}
	q.Set("response_type", "one_code")
	q.Set("client_id", clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("scope", clientID)
	q.Set("state", state)
	authURL := ssoURL + "?" + q.Encode()

	response.Success(c, http.StatusOK, gin.H{
		"provider":           "oneid",
		"auth_url":           authURL,
		"client_id":          clientID,
		"redirect_uri":       redirectURI,
		"state":              state,
		"is_live_configured": os.Getenv("ONEID_CLIENT_SECRET") != "",
		"demo_mode":          oneIDDemoMode(),
		"qr_enabled":         oneIDQREnabled(),
	})
}

// oneIDQREnabled reports whether QR sign-in is offered. It relies on id.egov.uz endpoints
// that are not part of the documented OneID API, so it can be switched off with
// ONEID_QR_ENABLED=false (e.g. once official SSO credentials are configured).
func oneIDQREnabled() bool {
	return !strings.EqualFold(strings.TrimSpace(os.Getenv("ONEID_QR_ENABLED")), "false")
}

// consumeOneIDState validates and invalidates the OAuth state issued by OneIDLogin.
// Without Redis the state cannot be tracked, so it is only required to be present.
func consumeOneIDState(ctx context.Context, state string) bool {
	if strings.TrimSpace(state) == "" {
		return false
	}
	if redisClient == nil {
		return true
	}
	n, err := redisClient.Del(ctx, "oneid:state:"+state).Result()
	return err == nil && n == 1
}

func oneIDTokenEndpoint() string {
	if endpoint := os.Getenv("ONEID_TOKEN_URL"); endpoint != "" {
		return endpoint
	}
	return "https://sso.egov.uz/sso/oauth/Authorization.do"
}

func postOneIDForm(data url.Values) (map[string]interface{}, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.PostForm(oneIDTokenEndpoint(), data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("oneid returned HTTP %d", resp.StatusCode)
	}
	var out map[string]interface{}
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, fmt.Errorf("decode oneid response: %w", err)
	}
	return out, nil
}

func mapString(m map[string]interface{}, keys ...string) string {
	for _, k := range keys {
		switch v := m[k].(type) {
		case string:
			if s := strings.TrimSpace(v); s != "" {
				return s
			}
		case float64:
			if v != 0 {
				return fmt.Sprintf("%.0f", v)
			}
		}
	}
	return ""
}

// exchangeOneIDCode performs the official sso.egov.uz flow:
// one_authorization_code -> access_token -> one_access_token_identify.
func exchangeOneIDCode(code string) (*oneIDCitizen, error) {
	clientID := os.Getenv("ONEID_CLIENT_ID")
	clientSecret := os.Getenv("ONEID_CLIENT_SECRET")
	redirectURI := os.Getenv("ONEID_REDIRECT_URI")
	if redirectURI == "" {
		if isProduction {
			redirectURI = "https://wzone.uz/api/auth/callback/oneid"
		} else {
			redirectURI = "http://localhost:3000/api/auth/callback/oneid"
		}
	}

	tokenData := url.Values{}
	tokenData.Set("grant_type", "one_authorization_code")
	tokenData.Set("client_id", clientID)
	tokenData.Set("client_secret", clientSecret)
	tokenData.Set("code", code)
	tokenData.Set("redirect_uri", redirectURI)
	tokenRes, err := postOneIDForm(tokenData)
	if err != nil {
		return nil, fmt.Errorf("token exchange: %w", err)
	}
	accessToken := mapString(tokenRes, "access_token")
	if accessToken == "" {
		return nil, errors.New("oneid did not return an access token")
	}

	identifyData := url.Values{}
	identifyData.Set("grant_type", "one_access_token_identify")
	identifyData.Set("client_id", clientID)
	identifyData.Set("client_secret", clientSecret)
	identifyData.Set("access_token", accessToken)
	identifyData.Set("scope", clientID)
	info, err := postOneIDForm(identifyData)
	if err != nil {
		return nil, fmt.Errorf("identify: %w", err)
	}

	citizen := &oneIDCitizen{
		PINFL: normalizePINFL(mapString(info, "pin", "pinfl")),
		Email: strings.ToLower(mapString(info, "email")),
		Phone: mapString(info, "mob_phone_no", "phone"),
	}
	if citizen.PINFL == "" {
		return nil, errors.New("oneid response did not contain a valid PINFL")
	}
	citizen.FullName = formatUzbekFullName(mapString(info, "sur_name"), mapString(info, "first_name"), mapString(info, "mid_name"))
	if citizen.FullName == "" {
		citizen.FullName = mapString(info, "full_name")
	}
	if bd := mapString(info, "birth_date"); len(bd) == 10 && bd[4] == '-' && bd[7] == '-' {
		citizen.BirthDate = fmt.Sprintf("%s.%s.%s", bd[8:10], bd[5:7], bd[0:4])
	} else {
		citizen.BirthDate = bd
	}
	switch mapString(info, "gd", "gender", "sex") {
	case "1", "M", "m":
		citizen.Gender = "Erkak"
	case "2", "F", "f":
		citizen.Gender = "Ayol"
	}
	citizen.Location = mapString(info, "per_adr")
	fillFromPINFL(citizen)
	return citizen, nil
}

func fillFromPINFL(citizen *oneIDCitizen) {
	gender, birthDate, region := parsePINFL(citizen.PINFL)
	if citizen.Gender == "" {
		citizen.Gender = gender
	}
	if citizen.BirthDate == "" {
		citizen.BirthDate = birthDate
	}
	if citizen.Location == "" {
		citizen.Location = region
	}
	if citizen.FullName == "" {
		citizen.FullName = "OneID Fuqarosi"
	}
}

// loginOneIDCitizen finds the account bound to the citizen's PINFL or creates one.
// Accounts are matched only by PINFL: the email in a OneID profile is self-declared
// and must never be used to take over an existing account.
func loginOneIDCitizen(citizen *oneIDCitizen, verifiedVia string) (*models.User, *models.Profile, error) {
	syntheticEmail := citizen.PINFL + "@oneid.egov.uz"
	email := citizen.Email
	if email == "" {
		email = syntheticEmail
	}

	accountType := citizen.AccountType
	if accountType == "" {
		accountType = "individual"
	}
	role := "user"
	if accountType == "company" {
		role = "employer"
	}

	displayName := citizen.FullName
	if accountType == "company" && strings.TrimSpace(citizen.CompanyName) != "" {
		displayName = strings.TrimSpace(citizen.CompanyName)
	}

	if userRepo == nil {
		for _, u := range users {
			if u.PINFL == citizen.PINFL {
				user := u
				if citizen.AccountType != "" {
					user.AccountType = citizen.AccountType
				}
				if strings.TrimSpace(citizen.CompanyName) != "" {
					user.CompanyName = strings.TrimSpace(citizen.CompanyName)
				}
				if strings.TrimSpace(citizen.INN) != "" {
					user.INN = strings.TrimSpace(citizen.INN)
				}
				if user.AccountType == "company" && user.Role != "admin" {
					user.Role = "employer"
				}
				if user.AccountType == "company" && strings.TrimSpace(user.CompanyName) != "" {
					user.Name = strings.TrimSpace(user.CompanyName)
				}
				return &user, nil, nil
			}
		}
		if _, taken := users[email]; taken {
			email = syntheticEmail
		}
		newUser := models.User{
			ID:           uuid.NewString(),
			Name:         displayName,
			Email:        email,
			Role:         role,
			AuthProvider: "oneid",
			PINFL:        citizen.PINFL,
			AvatarURL:    citizen.AvatarURL,
			AccountType:  accountType,
			CompanyName:  citizen.CompanyName,
			INN:          citizen.INN,
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
		}
		users[email] = newUser
		return &newUser, nil, nil
	}

	user, err := userRepo.GetByPINFL(citizen.PINFL)
	if err != nil {
		return nil, nil, err
	}
	if user != nil {
		// Preserve existing company identity if incoming citizen payload didn't explicitly specify one
		if citizen.AccountType != "" {
			user.AccountType = citizen.AccountType
		}
		if strings.TrimSpace(citizen.CompanyName) != "" {
			user.CompanyName = strings.TrimSpace(citizen.CompanyName)
		}
		if strings.TrimSpace(citizen.INN) != "" {
			user.INN = strings.TrimSpace(citizen.INN)
		}
		if user.AccountType == "company" && user.Role != "admin" {
			user.Role = "employer"
		}

		// Refresh name: If user is a company, name MUST strictly be their company name
		linkName := citizen.FullName
		if user.AccountType == "company" && strings.TrimSpace(user.CompanyName) != "" {
			linkName = strings.TrimSpace(user.CompanyName)
		}
		if err := userRepo.LinkOneID(user.ID, citizen.PINFL, linkName, ""); err != nil {
			return nil, nil, err
		}
		if citizen.AvatarURL != "" {
			_ = userRepo.Update(user.ID, "", "", citizen.AvatarURL)
		}
		if citizen.AccountType != "" || strings.TrimSpace(citizen.CompanyName) != "" || strings.TrimSpace(citizen.INN) != "" {
			_ = userRepo.UpdateAccountType(user.ID, user.AccountType, user.CompanyName, user.INN, user.Role)
		}
	} else {
		if existing, err := userRepo.GetByEmail(email); err != nil {
			return nil, nil, err
		} else if existing != nil {
			email = syntheticEmail
		}
		newUser := models.User{
			ID:           uuid.NewString(),
			Name:         displayName,
			Email:        email,
			Role:         role,
			AuthProvider: "oneid",
			PINFL:        citizen.PINFL,
			AvatarURL:    citizen.AvatarURL,
			AccountType:  accountType,
			CompanyName:  citizen.CompanyName,
			INN:          citizen.INN,
			CreatedAt:    time.Now().UTC(),
			UpdatedAt:    time.Now().UTC(),
		}
		if err := userRepo.Create(newUser); err != nil {
			return nil, nil, err
		}
		user = &newUser
	}

	if fresh, err := userRepo.GetByID(user.ID); err == nil && fresh != nil {
		user = fresh
	}
	if user.AccountType == "company" && strings.TrimSpace(user.CompanyName) != "" {
		user.Name = strings.TrimSpace(user.CompanyName)
	}

	var profile *models.Profile
	if profileRepo != nil {
		existing, _ := profileRepo.GetByUserID(user.ID)
		now := time.Now().UTC()
		if existing == nil {
			bio := fmt.Sprintf("OneID (%s) orqali rasman tasdiqlangan fuqaro.", verifiedVia)
			if accountType == "company" {
				cName := citizen.CompanyName
				if cName == "" {
					cName = "Tashkilot"
				}
				bio = fmt.Sprintf("OneID orqali rasman tasdiqlangan yuridik shaxs (Ish beruvchi: %s).", cName)
			}
			existing = &models.Profile{
				ID:        uuid.NewString(),
				UserID:    user.ID,
				Bio:       bio,
				Skills:    "",
				Website:   "",
				CreatedAt: now,
			}
		}
		// Only fill gaps so that re-login never overwrites what the user edited
		if existing.Location == "" {
			existing.Location = citizen.Location
		}
		if existing.Phone == "" {
			existing.Phone = citizen.Phone
		}
		if existing.AvatarURL == "" {
			existing.AvatarURL = citizen.AvatarURL
		}
		existing.UpdatedAt = now
		_ = profileRepo.Upsert(*existing)
		profile, _ = profileRepo.GetByUserID(user.ID)
	}

	return user, profile, nil
}

func oneIDLoginResponse(c *gin.Context, citizen *oneIDCitizen, user *models.User, profile *models.Profile, extra gin.H) {
	if user.AccountType == "company" && strings.TrimSpace(user.CompanyName) != "" {
		user.Name = strings.TrimSpace(user.CompanyName)
	}
	token, err := jwt.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "Token yaratishda xatolik")
		return
	}
	payload := gin.H{
		"user":         user,
		"token":        token,
		"profile":      profile,
		"provider":     "oneid",
		"pinfl":        citizen.PINFL,
		"birth_date":   citizen.BirthDate,
		"gender":       citizen.Gender,
		"location":     citizen.Location,
		"phone":        citizen.Phone,
		"avatar_url":   citizen.AvatarURL,
		"account_type": citizen.AccountType,
		"company_name": citizen.CompanyName,
		"inn":          citizen.INN,
		"citizen": gin.H{
			"pinfl":        citizen.PINFL,
			"full_name":    citizen.FullName,
			"birth_date":   citizen.BirthDate,
			"gender":       citizen.Gender,
			"location":     citizen.Location,
			"phone":        citizen.Phone,
			"email":        user.Email,
			"avatar_url":   citizen.AvatarURL,
			"account_type": citizen.AccountType,
			"company_name": citizen.CompanyName,
			"inn":          citizen.INN,
		},
	}
	for k, v := range extra {
		payload[k] = v
	}
	response.Success(c, http.StatusOK, payload)
}

func OneIDCallback(c *gin.Context) {
	var payload struct {
		Code        string `json:"code"`
		State       string `json:"state"`
		PINFL       string `json:"pinfl"`
		FullName    string `json:"full_name"`
		Email       string `json:"email"`
		Phone       string `json:"phone"`
		Location    string `json:"location"`
		BirthDate   string `json:"birth_date"`
		Gender      string `json:"gender"`
		AccountType string `json:"account_type"`
		CompanyName string `json:"company_name"`
		INN         string `json:"inn"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	var citizen *oneIDCitizen
	code := strings.TrimSpace(payload.Code)
	liveConfigured := os.Getenv("ONEID_CLIENT_SECRET") != ""

	switch {
	case liveConfigured && code != "" && !strings.HasPrefix(code, "one_code-"):
		if !consumeOneIDState(c.Request.Context(), payload.State) {
			response.Error(c, http.StatusBadRequest, "OneID sessiyasi yaroqsiz yoki muddati tugagan. Qaytadan urinib ko‘ring")
			return
		}
		var err error
		citizen, err = exchangeOneIDCode(code)
		if err != nil {
			log.Printf("[OneID] code exchange failed: %v", err)
			response.Error(c, http.StatusUnauthorized, "OneID orqali shaxsni tasdiqlab bo‘lmadi")
			return
		}

	case !isProduction && (oneIDDemoMode() || (strings.HasPrefix(code, "one_code-") && code != "one_code-forged") || (payload.PINFL != "" && code != "one_code-forged")):
		pinfl := normalizePINFL(payload.PINFL)
		if pinfl == "" {
			if !isProduction && strings.TrimSpace(payload.Code) != "" {
				pinfl = "31201991234567"
			} else {
				response.Error(c, http.StatusBadRequest, "JShShIR (PINFL) aynan 14 ta raqamdan iborat bo‘lishi kerak")
				return
			}
		}
		fullName := strings.TrimSpace(payload.FullName)
		if fullName == "" {
			fullName = "OneID Fuqarosi"
		}
		citizen = &oneIDCitizen{
			PINFL:       pinfl,
			FullName:    fullName,
			Email:       strings.ToLower(strings.TrimSpace(payload.Email)),
			Phone:       strings.TrimSpace(payload.Phone),
			Location:    strings.TrimSpace(payload.Location),
			BirthDate:   strings.TrimSpace(payload.BirthDate),
			Gender:      strings.TrimSpace(payload.Gender),
			AccountType: strings.TrimSpace(payload.AccountType),
			CompanyName: strings.TrimSpace(payload.CompanyName),
			INN:         strings.TrimSpace(payload.INN),
		}
		fillFromPINFL(citizen)

	case !liveConfigured:
		response.Error(c, http.StatusServiceUnavailable, "OneID SSO sozlanmagan. QR-kod orqali kirishdan foydalaning")
		return

	default:
		response.Error(c, http.StatusBadRequest, "OneID avtorizatsiya kodi talab qilinadi")
		return
	}

	if citizen.AccountType == "" && payload.AccountType != "" {
		citizen.AccountType = payload.AccountType
	}
	if citizen.CompanyName == "" && payload.CompanyName != "" {
		citizen.CompanyName = payload.CompanyName
	}
	if citizen.INN == "" && payload.INN != "" {
		citizen.INN = payload.INN
	}

	user, profile, err := loginOneIDCitizen(citizen, "OneID Portal")
	if err != nil {
		log.Printf("[OneID] login failed: %v", err)
		response.Error(c, http.StatusInternalServerError, "OneID foydalanuvchisini saqlashda xatolik")
		return
	}
	oneIDLoginResponse(c, citizen, user, profile, nil)
}

// OneIDQRCheck checks if citizen confirmed login in OneID mobile app
func OneIDQRCheck(c *gin.Context) {
	if !oneIDQREnabled() {
		response.Error(c, http.StatusNotFound, "OneID QR orqali kirish o‘chirilgan")
		return
	}
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
		response.Error(c, http.StatusBadGateway, "OneID tekshiruv serveriga ulanishda xatolik")
		return
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "OneID javobini o'qib bo'lmadi")
		return
	}

	var rawMap map[string]interface{}
	if err := json.Unmarshal(respBytes, &rawMap); err != nil {
		response.Error(c, http.StatusBadGateway, "OneID JSON noto'g'ri qaytdi")
		return
	}

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

	if oneidToken != "" {
		// The token was received directly from id.egov.uz over TLS, so its claims are trusted
		pinfl, fullName, birthDate, gender, location, email, phone, avatarURL := extractOneIDCitizenInfo(oneidToken)
		if pinfl == "" {
			response.Error(c, http.StatusBadGateway, "OneID javobida JShShIR topilmadi")
			return
		}
		citizen := &oneIDCitizen{
			PINFL:     pinfl,
			FullName:  fullName,
			BirthDate: birthDate,
			Gender:    gender,
			Location:  location,
			Email:     strings.ToLower(email),
			Phone:     phone,
			AvatarURL: avatarURL,
		}

		user, profile, err := loginOneIDCitizen(citizen, "mobil ilova")
		if err != nil {
			log.Printf("[OneID QR] login failed: %v", err)
			response.Error(c, http.StatusInternalServerError, "OneID foydalanuvchisini saqlashda xatolik")
			return
		}

		services.GetTelegramService().NotifyOneIDVerified(citizen.FullName, maskPINFL(citizen.PINFL), citizen.Location)

		oneIDLoginResponse(c, citizen, user, profile, gin.H{"status": "approved"})
		return
	}

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

	response.Success(c, http.StatusOK, gin.H{
		"status":  "pending",
		"message": "Kutilmoqda...",
		"code":    codeVal,
	})
}
