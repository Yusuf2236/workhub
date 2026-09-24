package middleware

import (
    "net/http"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/Yusuf2236/workhub/backend/pkg/jwt"
)

func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization header"})
            return
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        claims, err := jwt.ParseToken(token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            return
        }

        c.Set("user_id", claims.UserID)
        c.Set("email", claims.Email)
        c.Next()
    }
}
