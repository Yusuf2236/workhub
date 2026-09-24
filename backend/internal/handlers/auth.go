package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/hash"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"golang.org/x/crypto/bcrypt"
)

var users = map[string]models.User{}
var vacancies = map[string]models.Vacancy{}
var resumes = map[string]models.Resume{}

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
	if _, exists := users[strings.ToLower(payload.Email)]; exists {
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
		Name:      payload.Name,
		Email:     strings.ToLower(payload.Email),
		Password:  hashed,
		Role:      "user",
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	users[user.Email] = user

	token, err := jwt.GenerateToken(user.ID, user.Email)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to issue token")
		return
	}

	response.Success(c, http.StatusCreated, gin.H{
		"user":  user,
		"token": token,
	})
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

	user, ok := users[strings.ToLower(payload.Email)]
	if !ok {
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

	response.Success(c, http.StatusOK, gin.H{
		"user":  user,
		"token": token,
	})
}

func Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	email, _ := c.Get("email")
	for _, user := range users {
		if user.ID == userID.(string) || user.Email == email.(string) {
			response.Success(c, http.StatusOK, gin.H{"user": user})
			return
		}
	}
	response.Error(c, http.StatusNotFound, "user not found")
}

func ListVacancies(c *gin.Context) {
	items := make([]models.Vacancy, 0, len(vacancies))
	for _, v := range vacancies {
		items = append(items, v)
	}
	response.Success(c, http.StatusOK, gin.H{"vacancies": items})
}

func GetVacancy(c *gin.Context) {
	id := c.Param("id")
	for _, v := range vacancies {
		if v.ID == id {
			response.Success(c, http.StatusOK, gin.H{"vacancy": v})
			return
		}
	}
	response.Error(c, http.StatusNotFound, "vacancy not found")
}

func CreateVacancy(c *gin.Context) {
	var payload models.Vacancy
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Company) == "" {
		response.Error(c, http.StatusBadRequest, "title and company are required")
		return
	}
	payload.ID = uuid.NewString()
	payload.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	vacancies[payload.ID] = payload
	response.Success(c, http.StatusCreated, gin.H{"vacancy": payload})
}

func ApplyToVacancy(c *gin.Context) {
	vacancyID := c.Param("id")
	userID, _ := c.Get("user_id")
	if _, exists := vacancies[vacancyID]; !exists {
		response.Error(c, http.StatusNotFound, "vacancy not found")
		return
	}

	application := map[string]any{
		"id":          uuid.NewString(),
		"user_id":     userID.(string),
		"vacancy_id":  vacancyID,
		"status":      "submitted",
		"created_at":  time.Now().UTC().Format(time.RFC3339),
	}
	response.Success(c, http.StatusCreated, gin.H{"application": application})
}

func ListResumes(c *gin.Context) {
	items := make([]models.Resume, 0, len(resumes))
	for _, r := range resumes {
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
	payload.CreatedAt = time.Now().UTC().Format(time.RFC3339)
	resumes[payload.ID] = payload
	response.Success(c, http.StatusCreated, gin.H{"resume": payload})
}

var ErrInvalidToken = errors.New("invalid token")
