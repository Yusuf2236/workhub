package jwt

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var configuredSecret string

// tokenTTL is how long issued tokens stay valid (JWT_TTL, 7 days by default).
var tokenTTL = 7 * 24 * time.Hour

// SetTTL sets the token lifetime; non-positive values keep the default.
func SetTTL(ttl time.Duration) {
	if ttl > 0 {
		tokenTTL = ttl
	}
}

// SetSecret sets the signing secret loaded from config (including .env files,
// which are not visible through os.Getenv).
func SetSecret(secret string) {
	configuredSecret = secret
}

func getSecret() []byte {
	if configuredSecret != "" {
		return []byte(configuredSecret)
	}
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return []byte(s)
	}
	return []byte("dev-secret")
}

type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

func GenerateToken(userID, email string, role ...string) (string, error) {
	r := "user"
	if len(role) > 0 && role[0] != "" {
		r = role[0]
	}
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   r,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tokenTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getSecret())
}

func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return getSecret(), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}
