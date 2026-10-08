//go:build integration

// Integration tests run the real router against a fresh PostgreSQL database, so SQL that
// does not match the migrated schema fails here instead of in production.
//
//	TEST_DATABASE_URL=postgres://user:pass@localhost:5432/empty_db?sslmode=disable \
//	  go test -tags integration ./cmd/api/
package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/database"
	"github.com/Yusuf2236/workhub/backend/internal/handlers"
	"github.com/Yusuf2236/workhub/backend/internal/middleware"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

type apiClient struct {
	t      *testing.T
	router *gin.Engine
	ip     int
}

type apiResult struct {
	Status  int
	Success bool
	Error   string
	Data    map[string]any
}

// call sends a JSON request; each call comes from a new client IP so rate limits don't interfere.
func (c *apiClient) call(method, path, token string, body any) apiResult {
	c.t.Helper()
	var buf bytes.Buffer
	if body != nil {
		_ = json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	c.ip++
	req.RemoteAddr = fmt.Sprintf("10.1.%d.%d:1234", c.ip/250, c.ip%250+1)
	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	var res apiResult
	res.Status = rec.Code
	var raw struct {
		Success bool           `json:"success"`
		Error   string         `json:"error"`
		Data    map[string]any `json:"data"`
	}
	_ = json.Unmarshal(rec.Body.Bytes(), &raw)
	res.Success, res.Error, res.Data = raw.Success, raw.Error, raw.Data
	return res
}

func (c *apiClient) mustOK(res apiResult, what string) map[string]any {
	c.t.Helper()
	if res.Status >= 300 || !res.Success {
		c.t.Fatalf("%s: HTTP %d %s", what, res.Status, res.Error)
	}
	return res.Data
}

func setup(t *testing.T) (*apiClient, *sql.DB) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not set")
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatal(err)
	}
	if err := database.AutoMigrate(db); err != nil {
		t.Fatalf("migrations: %v", err)
	}
	if err := database.RunOnce(db, "go_recategorize_legacy_vacancies_v1", services.RecategorizeLegacyVacancies); err != nil {
		t.Fatalf("data migration: %v", err)
	}
	if err := database.RunOnce(db, "go_fix_legacy_vacancy_tags_v1", services.FixLegacyVacancyTags); err != nil {
		t.Fatalf("data migration: %v", err)
	}
	gin.SetMode(gin.TestMode)
	jwt.SetSecret("integration-test-secret")
	handlers.Init(db, nil, false)
	middleware.SetTokenValidator(handlers.TokenValidator())
	r := gin.New()
	setupMiddlewares(r)
	setupRoutes(r)
	return &apiClient{t: t, router: r}, db
}

func register(c *apiClient, name string) (token, id string) {
	email := strings.ToLower(name) + "-" + strconv.FormatInt(time.Now().UnixNano(), 36) + "@test.local"
	data := c.mustOK(c.call("POST", "/api/v1/auth/register", "", map[string]string{
		"name": name, "email": email, "password": "password123",
	}), "register "+name)
	return data["token"].(string), data["user"].(map[string]any)["id"].(string)
}

func TestHiringFlow(t *testing.T) {
	c, _ := setup(t)
	emp, _ := register(c, "Employer")
	cand, _ := register(c, "Candidate")

	// Profile with skills and settings (columns added by migration 010)
	c.mustOK(c.call("PUT", "/api/v1/profile", cand, map[string]any{
		"skills": "Go, PostgreSQL", "phone": "+998901112233", "settings": map[string]bool{"profile_public": true},
	}), "update profile")
	profile := c.mustOK(c.call("GET", "/api/v1/profile", cand, nil), "get profile")["profile"].(map[string]any)
	if profile["skills"] != "Go, PostgreSQL" {
		t.Fatalf("skills not saved: %v", profile["skills"])
	}

	vac := c.mustOK(c.call("POST", "/api/v1/vacancies", emp, map[string]string{
		"title": "Go dasturchi", "company": "Acme", "description": "Go va PostgreSQL",
	}), "create vacancy")["vacancy"].(map[string]any)
	vacID := vac["id"].(string)

	resume := c.mustOK(c.call("POST", "/api/v1/resumes", cand, map[string]string{
		"title": "Go Backend", "summary": "Tel: +998 90 111 22 33",
	}), "create resume")["resume"].(map[string]any)

	c.mustOK(c.call("POST", "/api/v1/vacancies/"+vacID+"/apply", cand, map[string]string{
		"cover_letter": "Salom", "resume_id": resume["id"].(string),
	}), "apply")
	if res := c.call("POST", "/api/v1/vacancies/"+vacID+"/apply", cand, nil); res.Status != http.StatusConflict {
		t.Fatalf("duplicate apply: HTTP %d", res.Status)
	}

	mine := c.mustOK(c.call("GET", "/api/v1/applications", cand, nil), "my applications")["applications"].([]any)
	if len(mine) != 1 || mine[0].(map[string]any)["vacancy_title"] != "Go dasturchi" {
		t.Fatalf("my applications: %v", mine)
	}

	received := c.mustOK(c.call("GET", "/api/v1/applications/received", emp, nil), "received")["applications"].([]any)
	if len(received) != 1 {
		t.Fatalf("received applications: %v", received)
	}
	app := received[0].(map[string]any)
	if app["cover_letter"] != "Salom" || app["resume_title"] != "Go Backend" || app["applicant_phone"] != "+998901112233" {
		t.Fatalf("employer view is missing details: %v", app)
	}

	if res := c.call("PATCH", "/api/v1/applications/"+app["id"].(string)+"/status", cand, map[string]string{"status": "accepted"}); res.Status != http.StatusForbidden {
		t.Fatalf("candidate changed status: HTTP %d", res.Status)
	}
	c.mustOK(c.call("PATCH", "/api/v1/applications/"+app["id"].(string)+"/status", emp, map[string]string{"status": "interview"}), "status")

	notes := c.mustOK(c.call("GET", "/api/v1/notifications", cand, nil), "notifications")["notifications"].([]any)
	if len(notes) < 2 {
		t.Fatalf("candidate notifications: %v", notes)
	}

	// Candidate pool hides contacts from other users
	pool := c.mustOK(c.call("GET", "/api/v1/resumes?all=true", emp, nil), "pool")["resumes"].([]any)
	for _, r := range pool {
		if strings.Contains(r.(map[string]any)["summary"].(string), "111 22 33") {
			t.Fatal("phone number visible in candidate pool")
		}
	}

	c.mustOK(c.call("GET", "/api/v1/vacancies/recommendations", cand, nil), "recommendations")
	c.mustOK(c.call("GET", "/api/v1/vacancies/mine", emp, nil), "my vacancies")
	c.mustOK(c.call("GET", "/api/v1/vacancies?ids="+vacID, "", nil), "vacancies by ids")
	c.mustOK(c.call("GET", "/api/v1/vacancies/sitemap", "", nil), "sitemap")
	c.mustOK(c.call("GET", "/api/v1/vacancies/"+vacID+"/comments", "", nil), "comments")
	c.mustOK(c.call("POST", "/api/v1/vacancies/"+vacID+"/comments", cand, map[string]string{"content": "Savol"}), "comment")
	c.mustOK(c.call("GET", "/api/v1/chat/messages?room=general", "", nil), "chat history")

	if res := c.call("PUT", "/api/v1/vacancies/"+vacID, cand, map[string]string{"title": "x"}); res.Status != http.StatusForbidden {
		t.Fatalf("non-owner edited vacancy: HTTP %d", res.Status)
	}
	c.mustOK(c.call("PUT", "/api/v1/vacancies/"+vacID, emp, map[string]string{"salary": "10 mln"}), "edit vacancy")
	c.mustOK(c.call("DELETE", "/api/v1/vacancies/"+vacID, emp, nil), "delete vacancy")
}

func TestLogoutAndPasswordReset(t *testing.T) {
	c, db := setup(t)
	token, userID := register(c, "Resetter")
	c.mustOK(c.call("GET", "/api/v1/auth/me", token, nil), "me")

	// Logout revokes the token on the server
	time.Sleep(1100 * time.Millisecond) // token issue times have second precision
	c.mustOK(c.call("POST", "/api/v1/auth/logout", token, nil), "logout")
	if res := c.call("GET", "/api/v1/auth/me", token, nil); res.Status != http.StatusUnauthorized {
		t.Fatalf("token still works after logout: HTTP %d", res.Status)
	}

	// Forgot password answers the same for unknown emails
	c.mustOK(c.call("POST", "/api/v1/auth/password/forgot", "", map[string]string{"email": "nobody@test.local"}), "forgot unknown")

	var email string
	if err := db.QueryRow(`SELECT email FROM users WHERE id = $1`, userID).Scan(&email); err != nil {
		t.Fatal(err)
	}
	c.mustOK(c.call("POST", "/api/v1/auth/password/forgot", "", map[string]string{"email": email}), "forgot")
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM auth_tokens WHERE user_id = $1 AND kind = 'reset_password' AND used_at IS NULL`, userID).Scan(&count); err != nil || count != 1 {
		t.Fatalf("reset token not stored: %d %v", count, err)
	}

	if res := c.call("POST", "/api/v1/auth/password/reset", "", map[string]string{"token": "wrong", "password": "newpassword1"}); res.Status != http.StatusBadRequest {
		t.Fatalf("reset with a wrong token: HTTP %d", res.Status)
	}

	// Without SMTP (and outside production) the email is written to the log; take the link from there
	var logs bytes.Buffer
	log.SetOutput(&logs)
	c.mustOK(c.call("POST", "/api/v1/auth/password/forgot", "", map[string]string{"email": email}), "forgot again")
	log.SetOutput(os.Stderr)
	m := regexp.MustCompile(`reset_token=([0-9a-f]+)`).FindStringSubmatch(logs.String())
	if m == nil {
		t.Fatalf("no reset link in the logged email:\n%s", logs.String())
	}

	loginBefore := c.mustOK(c.call("POST", "/api/v1/auth/login", "", map[string]string{"email": email, "password": "password123"}), "login")["token"].(string)
	time.Sleep(1100 * time.Millisecond)
	c.mustOK(c.call("POST", "/api/v1/auth/password/reset", "", map[string]string{"token": m[1], "password": "newpassword1"}), "reset")
	if res := c.call("POST", "/api/v1/auth/password/reset", "", map[string]string{"token": m[1], "password": "another12345"}); res.Status != http.StatusBadRequest {
		t.Fatalf("reset link worked twice: HTTP %d", res.Status)
	}
	if res := c.call("GET", "/api/v1/auth/me", loginBefore, nil); res.Status != http.StatusUnauthorized {
		t.Fatalf("old session survived the password reset: HTTP %d", res.Status)
	}
	if res := c.call("POST", "/api/v1/auth/login", "", map[string]string{"email": email, "password": "password123"}); res.Status != http.StatusUnauthorized {
		t.Fatalf("old password still works: HTTP %d", res.Status)
	}
	me := c.mustOK(c.call("POST", "/api/v1/auth/login", "", map[string]string{"email": email, "password": "newpassword1"}), "login with new password")
	if me["user"].(map[string]any)["email_verified"] != true {
		t.Fatal("reset link should verify the email")
	}
}
