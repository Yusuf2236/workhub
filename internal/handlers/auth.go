package handlers

import (
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
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
	if addr, err := mail.ParseAddress(email); err != nil || addr.Address != email {
		response.Error(c, http.StatusBadRequest, "invalid email address")
		return
	}
	if len(payload.Password) < 8 || len(payload.Password) > 72 {
		response.Error(c, http.StatusBadRequest, "password must be between 8 and 72 characters")
		return
	}

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
	sendVerificationEmail(&user)

	token, err := jwt.GenerateToken(user.ID, user.Email, user.Role)
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

	// Accounts created via Google/OneID have no password and cannot log in this way
	if user == nil || user.Password == "" {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := jwt.GenerateToken(user.ID, user.Email, user.Role)
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

var ErrInvalidToken = errors.New("invalid token")
