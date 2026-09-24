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
var applications = map[string]models.Application{}

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

    email := strings.ToLower(payload.Email)
    if _, exists := users[email]; exists {
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
        Email:     email,
        Password:  hashed,
        Role:      "user",
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }

    users[email] = user

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

    response.Success(c, http.StatusOK, gin.H{"user": user, "token": token})
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

var ErrInvalidToken = errors.New("invalid token")
