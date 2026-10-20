package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/hash"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	tokenKindVerifyEmail   = "verify_email"
	tokenKindResetPassword = "reset_password"
	verifyEmailTTL         = 48 * time.Hour
	resetPasswordTTL       = time.Hour
)

// newEmailToken returns a random URL-safe token and the hash stored in the database.
func newEmailToken() (token, tokenHash string, err error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", "", err
	}
	token = hex.EncodeToString(buf)
	return token, hashEmailToken(token), nil
}

func hashEmailToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

// issueEmailLink stores a one-time token for the user and returns the link to put in the email.
func issueEmailLink(user *models.User, kind string, ttl time.Duration, param string) (string, error) {
	token, tokenHash, err := newEmailToken()
	if err != nil {
		return "", err
	}
	if err := authTokenRepo.Create(uuid.NewString(), user.ID, kind, tokenHash, time.Now().Add(ttl)); err != nil {
		return "", err
	}
	return services.SiteURL() + "/?" + param + "=" + url.QueryEscape(token), nil
}

func sendVerificationEmail(user *models.User) {
	if authTokenRepo == nil || user.EmailVerified || user.Email == "" {
		return
	}
	link, err := issueEmailLink(user, tokenKindVerifyEmail, verifyEmailTTL, "verify_email")
	if err != nil {
		log.Printf("[Auth] verification link for %s: %v", user.ID, err)
		return
	}
	services.SendMail(user.Email, "WZone: emailingizni tasdiqlang",
		"Assalomu alaykum, "+user.Name+"!\n\n"+
			"WZone hisobingizni tasdiqlash uchun quyidagi havolani oching (48 soat amal qiladi):\n"+link+"\n\n"+
			"Agar siz ro‘yxatdan o‘tmagan bo‘lsangiz, bu xatni e’tiborsiz qoldiring.", isProduction)
}

// Logout invalidates every token issued to the user so far (all devices).
func Logout(c *gin.Context) {
	if userRepo != nil {
		if err := userRepo.RevokeTokens(currentUserID(c)); err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
	}
	response.Success(c, http.StatusOK, gin.H{"logged_out": true})
}

// ForgotPassword emails a reset link. It always answers the same way so the endpoint
// cannot be used to find out which emails are registered.
func ForgotPassword(c *gin.Context) {
	var payload struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || strings.TrimSpace(payload.Email) == "" {
		response.Error(c, http.StatusBadRequest, "email is required")
		return
	}
	answer := gin.H{"message": "Agar bu email ro‘yxatdan o‘tgan bo‘lsa, unga parolni tiklash havolasi yuborildi"}

	if userRepo == nil || authTokenRepo == nil {
		response.Success(c, http.StatusOK, answer)
		return
	}
	user, err := userRepo.GetByEmail(strings.ToLower(strings.TrimSpace(payload.Email)))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "database error")
		return
	}
	if user != nil {
		link, err := issueEmailLink(user, tokenKindResetPassword, resetPasswordTTL, "reset_token")
		if err != nil {
			log.Printf("[Auth] reset link for %s: %v", user.ID, err)
		} else {
			services.SendMail(user.Email, "WZone: parolni tiklash",
				"Assalomu alaykum, "+user.Name+"!\n\n"+
					"Yangi parol o‘rnatish uchun quyidagi havolani oching (1 soat amal qiladi):\n"+link+"\n\n"+
					"Agar parolni tiklashni so‘ramagan bo‘lsangiz, bu xatni e’tiborsiz qoldiring — parolingiz o‘zgarmaydi.", isProduction)
		}
	}
	response.Success(c, http.StatusOK, answer)
}

// ResetPassword sets a new password from an emailed link and signs out all devices.
func ResetPassword(c *gin.Context) {
	var payload struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.Token == "" {
		response.Error(c, http.StatusBadRequest, "token and password are required")
		return
	}
	if len(payload.Password) < 8 || len(payload.Password) > 72 {
		response.Error(c, http.StatusBadRequest, "password must be between 8 and 72 characters")
		return
	}
	if userRepo == nil || authTokenRepo == nil {
		response.Error(c, http.StatusServiceUnavailable, "database is not available")
		return
	}

	userID, ok, err := authTokenRepo.Consume(tokenKindResetPassword, hashEmailToken(payload.Token))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "database error")
		return
	}
	if !ok {
		response.Error(c, http.StatusBadRequest, "Havola noto‘g‘ri yoki muddati o‘tgan. Parolni tiklashni qaytadan so‘rang")
		return
	}

	hashed, err := hash.HashPassword(payload.Password)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to hash password")
		return
	}
	if err := userRepo.SetPassword(userID, hashed); err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to update password")
		return
	}
	// Opening the link proves the user owns the inbox
	_ = userRepo.MarkEmailVerified(userID)
	_ = userRepo.RevokeTokens(userID)

	response.Success(c, http.StatusOK, gin.H{"password_reset": true})
}

// VerifyEmail confirms the address from an emailed link.
func VerifyEmail(c *gin.Context) {
	var payload struct {
		Token string `json:"token"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil || payload.Token == "" {
		response.Error(c, http.StatusBadRequest, "token is required")
		return
	}
	if userRepo == nil || authTokenRepo == nil {
		response.Error(c, http.StatusServiceUnavailable, "database is not available")
		return
	}
	userID, ok, err := authTokenRepo.Consume(tokenKindVerifyEmail, hashEmailToken(payload.Token))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "database error")
		return
	}
	if !ok {
		response.Error(c, http.StatusBadRequest, "Havola noto‘g‘ri yoki muddati o‘tgan")
		return
	}
	if err := userRepo.MarkEmailVerified(userID); err != nil {
		response.Error(c, http.StatusInternalServerError, "database error")
		return
	}
	response.Success(c, http.StatusOK, gin.H{"email_verified": true})
}

// ResendVerification emails a new verification link to the signed-in user.
func ResendVerification(c *gin.Context) {
	if userRepo == nil {
		response.Error(c, http.StatusServiceUnavailable, "database is not available")
		return
	}
	user, err := userRepo.GetByID(currentUserID(c))
	if err != nil || user == nil {
		response.Error(c, http.StatusInternalServerError, "database error")
		return
	}
	if user.EmailVerified {
		response.Success(c, http.StatusOK, gin.H{"email_verified": true})
		return
	}
	sendVerificationEmail(user)
	response.Success(c, http.StatusOK, gin.H{"sent": true})
}

// tokenStillValid rejects tokens issued before the user's last logout or password reset,
// and tokens of deleted users.
func tokenStillValid(userID string, issuedAt time.Time) bool {
	if userRepo == nil {
		return true
	}
	validAfter, exists, err := userRepo.TokensValidAfter(userID)
	if err != nil {
		// Do not lock everyone out when the database hiccups
		return true
	}
	return exists && !issuedAt.Before(validAfter)
}

// TokenValidator is installed into the auth middleware by main.
func TokenValidator() func(userID string, issuedAt time.Time) bool {
	return tokenStillValid
}
