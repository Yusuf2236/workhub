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

	t.Run("Rejects mock credential unless mock mode is explicitly enabled", func(t *testing.T) {
		payload := map[string]string{
			"credential": "mock-verified-google-token",
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

	t.Run("Rejects mock credential in production even when enabled", func(t *testing.T) {
		t.Setenv("AUTH_MOCK_ENABLED", "true")
		isProduction = true
		defer func() { isProduction = false }()

		payload := map[string]string{
			"credential": "mock-verified-google-token",
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
		t.Setenv("AUTH_MOCK_ENABLED", "true")
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

func TestOneIDCallbackRejectsSelfDeclaredPINFL(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auth/oneid/callback", OneIDCallback)

	payload := map[string]string{
		"code":  "one_code-forged",
		"pinfl": "31201991234567",
		"email": "victim@domain.uz",
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/callback", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code == http.StatusOK {
		t.Fatalf("self-declared PINFL must not log in outside demo mode. Body: %s", w.Body.String())
	}
}

func TestOneIDCallbackPortalAndQR(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auth/oneid/callback", OneIDCallback)

	t.Run("Accepts OneID portal login with citizen details", func(t *testing.T) {
		payload := map[string]string{
			"code":       "one_code-portal-test-123456",
			"pinfl":      "31201991234567",
			"full_name":  "Yusuf Usmonov",
			"phone":      "+998901234567",
			"location":   "Toshkent shahri",
			"birth_date": "12.01.1999",
			"gender":     "Erkak",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/callback", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
		}

		var resp map[string]any
		if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
			t.Fatalf("expected valid JSON: %v", err)
		}
		data, ok := resp["data"].(map[string]any)
		if !ok || data["token"] == "" {
			t.Fatalf("expected token in response data: %v", resp)
		}
		if data["pinfl"] != "31201991234567" {
			t.Fatalf("expected PINFL in response data: %v", data)
		}
	})

	t.Run("Accepts OneID simulated QR login", func(t *testing.T) {
		payload := map[string]string{
			"code":      "one_code-demo-qr-998877",
			"pinfl":     "31201991234567",
			"full_name": "Yusuf Usmonov",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/callback", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Rejects OneID demo code in production", func(t *testing.T) {
		isProduction = true
		defer func() { isProduction = false }()

		payload := map[string]string{
			"code":      "one_code-demo-qr-998877",
			"pinfl":     "31201991234567",
			"full_name": "Yusuf Usmonov",
		}
		bodyBytes, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/callback", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code == http.StatusOK {
			t.Fatalf("expected error in production for demo code, got 200 OK: %s", w.Body.String())
		}
	})
}

