package middleware

import (
	"net"
	"net/http"
	"net/url"
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
	"https://wzone.uz",
	"https://app.wzone.uz",
	"https://admin.wzone.uz",
	"https://api.wzone.uz",
}

// IsOriginAllowed reports whether the browser origin may access the API.
func IsOriginAllowed(origin string) bool {
	return isOriginAllowed(origin)
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
	if strings.HasPrefix(origin, "https://") && (strings.HasSuffix(origin, ".workhub.uz") || strings.HasSuffix(origin, ".wzone.uz") || origin == "https://wzone.uz" || origin == "https://workhub.uz") {
		return true
	}
	return false
}

// IsSameHostOrigin accepts pages served from the same host as the API (any port), e.g. the
// site behind nginx on its own domain, or the admin on :3001 talking to the API on :80/:8080.
func IsSameHostOrigin(r *http.Request, origin string) bool {
	u, err := url.Parse(origin)
	if err != nil || u.Hostname() == "" || (u.Scheme != "http" && u.Scheme != "https") {
		return false
	}
	for _, h := range []string{r.Host, r.Header.Get("X-Forwarded-Host")} {
		h = strings.TrimSpace(strings.Split(h, ",")[0])
		if h == "" {
			continue
		}
		if host, _, err := net.SplitHostPort(h); err == nil {
			h = host
		}
		if strings.EqualFold(h, u.Hostname()) {
			return true
		}
	}
	return false
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if isOriginAllowed(origin) || (origin != "" && IsSameHostOrigin(c.Request, origin)) {
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
