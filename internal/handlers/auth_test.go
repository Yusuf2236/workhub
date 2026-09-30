package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGoogleAuthSecurity(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auth/google", GoogleAuth)

	t.Run("Rejects unauthenticated email-only takeover attempt", func(t *testing.T) {
		payload := map[string]string{
			"email": "victim@domain.uz",
			"name":  "Attacker Impersonator",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401 Unauthorized, got %d. Body: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Rejects bogus non-verifiable credential", func(t *testing.T) {
		payload := map[string]string{
			"credential": "invalid.fake.jwt.token",
			"email":      "victim@domain.uz",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("expected status 401 Unauthorized, got %d. Body: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Accepts valid mock credential for automated tests and dev", func(t *testing.T) {
		payload := map[string]string{
			"credential": "mock-verified-google-token",
			"email":      "developer@workhub.uz",
			"name":       "Developer User",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/google", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected status 200 OK, got %d. Body: %s", w.Code, w.Body.String())
		}

		var resp map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("expected valid JSON: %v", err)
		}
		data, ok := resp["data"].(map[string]any)
		if !ok || data["token"] == "" {
			t.Fatalf("expected valid token in response data: %v", resp)
		}
	})
}
