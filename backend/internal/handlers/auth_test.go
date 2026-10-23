package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		orgs, ok := data["organizations"].([]any)
		if !ok || len(orgs) == 0 {
			t.Fatalf("expected organizations list in response data: %v", data)
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

func TestSelectOneIDIdentity(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auth/oneid/callback", OneIDCallback)
	router.POST("/api/v1/auth/oneid/select-identity", func(c *gin.Context) {
		// Mock auth middleware
		authHeader := c.GetHeader("Authorization")
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := jwt.ParseToken(token)
		if err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}
		c.Set("user_id", claims.UserID)
		c.Next()
	}, SelectOneIDIdentity)

	// 1. Initial OneID login
	loginPayload := map[string]string{
		"code":       "one_code-portal-org-test",
		"pinfl":      "31201991234567",
		"full_name":  "Alisher Navoiy",
		"phone":      "+998901234567",
		"location":   "Toshkent shahri",
	}
	bodyBytes, _ := json.Marshal(loginPayload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/callback", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", w.Code)
	}

	var loginResp map[string]any
	_ = json.Unmarshal(w.Body.Bytes(), &loginResp)
	token := loginResp["data"].(map[string]any)["token"].(string)

	// 2. Select Company Identity
	t.Run("Switch to Organization identity", func(t *testing.T) {
		selectPayload := map[string]any{
			"account_type": "company",
			"company_name": "TECH INNOVATIONS MCHJ",
			"inn":          "301234567",
			"role_in_org":  "Direktor",
		}
		body, _ := json.Marshal(selectPayload)
		selReq, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/select-identity", bytes.NewBuffer(body))
		selReq.Header.Set("Content-Type", "application/json")
		selReq.Header.Set("Authorization", "Bearer "+token)
		selW := httptest.NewRecorder()
		router.ServeHTTP(selW, selReq)

		if selW.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", selW.Code, selW.Body.String())
		}

		var selResp map[string]any
		_ = json.Unmarshal(selW.Body.Bytes(), &selResp)
		userData := selResp["data"].(map[string]any)["user"].(map[string]any)
		if userData["account_type"] != "company" {
			t.Fatalf("expected account_type company, got %v", userData["account_type"])
		}
		if userData["role"] != "employer" {
			t.Fatalf("expected role employer, got %v", userData["role"])
		}
		if userData["company_name"] != "TECH INNOVATIONS MCHJ" {
			t.Fatalf("expected company_name 'TECH INNOVATIONS MCHJ', got %v", userData["company_name"])
		}
		if userData["name"] != "TECH INNOVATIONS MCHJ" {
			t.Fatalf("expected name to match company name, got %v", userData["name"])
		}
	})

	// 3. Switch back to Individual
	t.Run("Switch to Individual identity", func(t *testing.T) {
		selectPayload := map[string]any{
			"account_type": "individual",
		}
		body, _ := json.Marshal(selectPayload)
		selReq, _ := http.NewRequest(http.MethodPost, "/api/v1/auth/oneid/select-identity", bytes.NewBuffer(body))
		selReq.Header.Set("Content-Type", "application/json")
		selReq.Header.Set("Authorization", "Bearer "+token)
		selW := httptest.NewRecorder()
		router.ServeHTTP(selW, selReq)

		if selW.Code != http.StatusOK {
			t.Fatalf("expected 200 OK, got %d. Body: %s", selW.Code, selW.Body.String())
		}

		var selResp map[string]any
		_ = json.Unmarshal(selW.Body.Bytes(), &selResp)
		userData := selResp["data"].(map[string]any)["user"].(map[string]any)
		if userData["account_type"] != "individual" {
			t.Fatalf("expected account_type individual, got %v", userData["account_type"])
		}
		if userData["role"] != "user" {
			t.Fatalf("expected role user, got %v", userData["role"])
		}
	})
}

func TestOneIDStateCSRFProtection(t *testing.T) {
	ctx := context.Background()

	// 1. Empty state must be rejected
	if consumeOneIDState(ctx, "") {
		t.Fatal("empty state must be rejected")
	}

	// 2. Random / forged state must be rejected
	if consumeOneIDState(ctx, "forged_state_12345") {
		t.Fatal("forged state must be rejected")
	}

	// 3. Stored state must be valid
	validState := "oneid_test_" + uuid.NewString()
	storeOneIDState(ctx, validState)

	if !consumeOneIDState(ctx, validState) {
		t.Fatal("stored state must be accepted")
	}

	// 4. Replay of consumed state must be rejected
	if consumeOneIDState(ctx, validState) {
		t.Fatal("replayed state must be rejected on second use")
	}
}


