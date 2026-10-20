package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// rateWindow counts requests from one client within the current window.
type rateWindow struct {
	start time.Time
	count int
}

// RateLimiter is a fixed-window, in-memory limiter keyed by client IP.
// It protects one API instance; a multi-instance deployment would need Redis.
type RateLimiter struct {
	mu      sync.Mutex
	limit   int
	window  time.Duration
	clients map[string]*rateWindow
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{limit: limit, window: window, clients: make(map[string]*rateWindow)}
	go rl.cleanup()
	return rl
}

// Allow records a request for key and reports whether it is within the limit.
func (rl *RateLimiter) Allow(key string) bool {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()
	w, ok := rl.clients[key]
	if !ok || now.Sub(w.start) >= rl.window {
		rl.clients[key] = &rateWindow{start: now, count: 1}
		return true
	}
	if w.count >= rl.limit {
		return false
	}
	w.count++
	return true
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.window)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		rl.mu.Lock()
		for key, w := range rl.clients {
			if now.Sub(w.start) >= rl.window {
				delete(rl.clients, key)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimit rejects clients that exceed limit requests per window.
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	rl := NewRateLimiter(limit, window)
	return func(c *gin.Context) {
		if !rl.Allow(c.ClientIP()) {
			c.Header("Retry-After", strconv.Itoa(int(window.Seconds())))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error":   "Juda ko‘p so‘rov yuborildi. Birozdan keyin qayta urinib ko‘ring",
			})
			return
		}
		c.Next()
	}
}
