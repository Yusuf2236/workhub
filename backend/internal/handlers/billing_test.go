package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func TestClickWebhookSignature(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/billing/click", ClickWebhook)
	t.Setenv("CLICK_SECRET_KEY", "click_secret_key_2026")
	users["user_abc@test.uz"] = models.User{ID: "user_abc", Email: "user_abc@test.uz"}
	defer delete(users, "user_abc@test.uz")

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

func TestClickWebhookRejectsWithoutConfiguredSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/billing/click", ClickWebhook)
	t.Setenv("CLICK_SECRET_KEY", "")

	// Signature computed with the old hardcoded default key must not be accepted
	form := url.Values{}
	form.Set("click_trans_id", "1")
	form.Set("service_id", "999")
	form.Set("merchant_trans_id", "user_abc")
	form.Set("amount", "250000")
	form.Set("action", "1")
	form.Set("sign_time", "t")
	form.Set("sign_string", computeClickSign("1"+"999"+"click_secret_key_2026"+"user_abc"+"1"+"250000"+"1"+"t"))

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/billing/click", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var res map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &res)
	if errCode, ok := res["error"].(float64); !ok || int(errCode) != -1 {
		t.Fatalf("expected Click error -1 without configured secret, got %v", res["error"])
	}
}

func TestPaymentWebhookRequiresSecret(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/billing/webhook", HandlePaymentWebhook)
	t.Setenv("PAYMENT_WEBHOOK_SECRET", "s3cret")

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/billing/webhook", strings.NewReader(`{"user_id":"u1","plan":"enterprise"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without webhook secret, got %d", w.Code)
	}
}

func TestCanAccessRoom(t *testing.T) {
	if !canAccessRoom("general", "guest") {
		t.Fatal("public room must be open")
	}
	if canAccessRoom("dm_alice_bob", "mallory") {
		t.Fatal("outsider must not read a DM room")
	}
	if canAccessRoom("dm_alice_bob", "guest") {
		t.Fatal("guest must not read a DM room")
	}
	if !canAccessRoom("dm_alice_bob", "bob") {
		t.Fatal("participant must access their DM room")
	}
	if canAccessRoom("bad room/../x", "bob") {
		t.Fatal("invalid room ids must be rejected")
	}
}
