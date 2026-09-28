package services

import (
    "fmt"
    "time"

    "github.com/Yusuf2236/workhub/backend/internal/models"
    "github.com/Yusuf2236/workhub/backend/pkg/hash"
    "github.com/Yusuf2236/workhub/backend/pkg/jwt"
)

type AuthService struct{}

func (s *AuthService) Register(name, email, password string) (*models.User, string, error) {
    if name == "" || email == "" || password == "" {
        return nil, "", fmt.Errorf("name, email and password are required")
    }

    hashed, err := hash.HashPassword(password)
    if err != nil {
        return nil, "", err
    }

    user := &models.User{
        Name:      name,
        Email:     email,
        Password:  hashed,
        Role:      "user",
        CreatedAt: time.Now().UTC(),
        UpdatedAt: time.Now().UTC(),
    }

    token, err := jwt.GenerateToken(user.ID, user.Email)
    if err != nil {
        return nil, "", err
    }

    return user, token, nil
}
