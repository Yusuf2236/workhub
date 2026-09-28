package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestHealthEndpoint(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/health", Health)

	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("expected valid JSON response: %v", err)
	}

	if body["success"] != true {
		t.Errorf("expected success: true, got %v", body["success"])
	}

	data, ok := body["data"].(map[string]any)
	if !ok || data["status"] != "ok" {
		t.Errorf("expected data.status to be 'ok', got %v", data["status"])
	}
}
