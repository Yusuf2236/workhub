package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestClickWebhookSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/billing/click", ClickWebhook)

	t.Run("Rejects request with forged or missing signature", func(t *testing.T) {
		form := url.Values{}
		form.Set("click_trans_id", "123456")
		form.Set("service_id", "999")
		form.Set("merchant_trans_id", "user_abc")
		form.Set("amount", "250000")
		form.Set("action", "0")
		form.Set("sign_time", "2026-09-30 12:00:00")
		form.Set("sign_string", "fake_forged_signature_attempt")

		req, _ := http.NewRequest(http.MethodPost, "/api/v1/billing/click", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected HTTP 200, got %d", w.Code)
		}

		var res map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &res)
		if errCode, ok := res["error"].(float64); !ok || int(errCode) != -1 {
			t.Fatalf("expected Click error code -1 (SIGN CHECK FAILED), got %v", res["error"])
		}
	})

	t.Run("Accepts request with valid signature", func(t *testing.T) {
		secretKey := "click_secret_key_2026"
		clickTransID := "123456"
		serviceID := "999"
		merchantTransID := "user_abc"
		amount := "250000"
		action := "0"
		signTime := "2026-09-30 12:00:00"

		validSign := computeClickSign(clickTransID + serviceID + secretKey + merchantTransID + amount + action + signTime)

		form := url.Values{}
		form.Set("click_trans_id", clickTransID)
		form.Set("service_id", serviceID)
		form.Set("merchant_trans_id", merchantTransID)
		form.Set("amount", amount)
		form.Set("action", action)
		form.Set("sign_time", signTime)
		form.Set("sign_string", validSign)

		req, _ := http.NewRequest(http.MethodPost, "/api/v1/billing/click", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("expected HTTP 200, got %d", w.Code)
		}

		var res map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &res)
		if errCode, ok := res["error"].(float64); !ok || int(errCode) != 0 {
			t.Fatalf("expected Click error code 0 (Success), got %v", res["error"])
		}
	})
}
