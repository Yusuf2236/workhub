package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

var defaultAllowedOrigins = []string{
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:3005",
	"http://localhost:8080",
	"http://127.0.0.1:3000",
	"http://127.0.0.1:3001",
	"http://127.0.0.1:3005",
	"http://127.0.0.1:8080",
	"https://workhub.uz",
	"https://app.workhub.uz",
	"https://admin.workhub.uz",
}

func isOriginAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	if envOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); envOrigins != "" {
		for _, o := range strings.Split(envOrigins, ",") {
			if strings.TrimSpace(o) == origin {
				return true
			}
		}
	}
	for _, o := range defaultAllowedOrigins {
		if o == origin {
			return true
		}
	}
	if strings.HasPrefix(origin, "https://") && strings.HasSuffix(origin, ".workhub.uz") {
		return true
	}
	return false
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if isOriginAllowed(origin) {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else if origin == "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
