package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/gin-gonic/gin"
)

// tokenValidator lets the app reject tokens revoked by logout or password reset.
var tokenValidator func(userID string, issuedAt time.Time) bool

// SetTokenValidator installs the revocation check used by the auth middleware.
func SetTokenValidator(fn func(userID string, issuedAt time.Time) bool) {
	tokenValidator = fn
}

// ParseValidToken parses a bearer token and applies the revocation check.
func ParseValidToken(token string) (*jwt.Claims, error) {
	claims, err := jwt.ParseToken(token)
	if err != nil {
		return nil, err
	}
	if tokenValidator != nil {
		var issued time.Time
		if claims.IssuedAt != nil {
			issued = claims.IssuedAt.Time
		}
		if !tokenValidator(claims.UserID, issued) {
			return nil, errTokenRevoked
		}
	}
	return claims, nil
}

var errTokenRevoked = errors.New("token revoked")

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := ParseValidToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := ParseValidToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		if claims.Role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Forbidden: Faqat ma'mur (admin) huquqiga ega foydalanuvchilar kira oladi",
			})
			return
		}

		c.Next()
	}
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if claims, err := ParseValidToken(token); err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("email", claims.Email)
				c.Set("role", claims.Role)
			}
		}
		c.Next()
	}
}
