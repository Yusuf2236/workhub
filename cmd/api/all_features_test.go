//go:build integration

package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/google/uuid"
)

// callMultipart sends a multipart form request for file uploads.
func (c *apiClient) callMultipart(method, path, token, fieldName, fileName string, content []byte) apiResult {
	c.t.Helper()
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	part, err := writer.CreateFormFile(fieldName, fileName)
	if err != nil {
		c.t.Fatal(err)
	}
	if _, err := part.Write(content); err != nil {
		c.t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		c.t.Fatal(err)
	}

	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
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

// callForm sends an x-www-form-urlencoded request (e.g. for Click webhooks).
func (c *apiClient) callForm(method, path string, form url.Values) apiResult {
	c.t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
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

// 1. Health check & security headers
func TestHealthAndMetaEndpoints(t *testing.T) {
	c, _ := setup(t)

	res := c.call("GET", "/health", "", nil)
	data := c.mustOK(res, "health check")
	if data["status"] != "ok" || data["service"] != "workhub-api" {
		t.Fatalf("unexpected health payload: %v", data)
	}

	// Uploads static directory nosniff header
	req := httptest.NewRequest("GET", "/uploads/non_existent.txt", nil)
	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("expected nosniff header on uploads route")
	}
}

// 2. Google OAuth and OneID SSO auth endpoints
func TestOAuthEndpoints(t *testing.T) {
	c, _ := setup(t)

	// Google Auth Mock Login in dev mode
	t.Setenv("AUTH_MOCK_ENABLED", "true")
	googleRes := c.call("POST", "/api/v1/auth/google", "", map[string]string{
		"credential": "mock-verified-google-token",
		"email":      "google-user@test.local",
		"name":       "Google Tester",
	})
	gData := c.mustOK(googleRes, "google mock login")
	if gData["token"] == "" || gData["user"] == nil {
		t.Fatalf("expected token and user in google login, got %v", gData)
	}

	// OneID SSO login init
	oneidRes := c.call("GET", "/api/v1/auth/oneid/login", "", nil)
	oData := c.mustOK(oneidRes, "oneid login init")
	if oData["provider"] != "oneid" || oData["auth_url"] == "" {
		t.Fatalf("invalid oneid login response: %v", oData)
	}
}

// 3. Email Verification Flow
func TestEmailVerificationLifecycle(t *testing.T) {
	c, db := setup(t)
	token, userID := register(c, "EmailVerifUser")

	// Initially unverified
	me := c.mustOK(c.call("GET", "/api/v1/auth/me", token, nil), "me before verif")
	if me["user"].(map[string]any)["email_verified"] == true {
		t.Fatalf("expected user to be unverified initially")
	}

	// Insert known verify token directly to verify consumption logic
	rawToken := uuid.NewString() + uuid.NewString()
	tokenHash := fmt.Sprintf("%x", sha256.Sum256([]byte(rawToken)))
	_, err := db.Exec(`INSERT INTO auth_tokens (id, user_id, kind, token_hash, expires_at) VALUES ($1, $2, 'verify_email', $3, $4)`,
		uuid.NewString(), userID, tokenHash, time.Now().Add(24*time.Hour))
	if err != nil {
		t.Fatalf("failed to insert auth_token: %v", err)
	}

	// Verify using token
	vRes := c.call("POST", "/api/v1/auth/email/verify", "", map[string]string{"token": rawToken})
	c.mustOK(vRes, "email verify")

	// Token cannot be reused
	vResAgain := c.call("POST", "/api/v1/auth/email/verify", "", map[string]string{"token": rawToken})
	if vResAgain.Status != http.StatusBadRequest {
		t.Fatalf("expected 400 for consumed token, got %d", vResAgain.Status)
	}

	// User is now verified
	meAfter := c.mustOK(c.call("GET", "/api/v1/auth/me", token, nil), "me after verif")
	if meAfter["user"].(map[string]any)["email_verified"] != true {
		t.Fatalf("expected user to be verified now")
	}

	// Resend when already verified returns email_verified: true
	resendRes := c.mustOK(c.call("POST", "/api/v1/auth/email/resend", token, nil), "resend verified")
	if resendRes["email_verified"] != true {
		t.Fatalf("expected email_verified: true in resend response")
	}
}

// 4. Profile and Avatar Upload
func TestProfileAndAvatarUpload(t *testing.T) {
	c, _ := setup(t)
	token, _ := register(c, "AvatarUser")

	// Profile update
	pData := c.mustOK(c.call("PUT", "/api/v1/profile", token, map[string]any{
		"name":     "Avatar Updated",
		"bio":      "Experienced engineer",
		"location": "Toshkent",
		"website":  "https://workhub.uz",
		"phone":    "+998901234567",
		"settings": map[string]bool{"notify_job_alerts": true},
	}), "update profile")

	prof := pData["profile"].(map[string]any)
	if prof["location"] != "Toshkent" || prof["phone"] != "+998901234567" {
		t.Fatalf("profile mismatch: %v", prof)
	}

	// Avatar upload with valid PNG header bytes
	pngBytes := []byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n', 0, 0, 0, 13, 'I', 'H', 'D', 'R'}
	avatarRes := c.callMultipart("POST", "/api/v1/profile/avatar", token, "avatar", "profile.png", pngBytes)
	aData := c.mustOK(avatarRes, "avatar upload")
	if !strings.HasPrefix(aData["avatar_url"].(string), "/uploads/avatars/") {
		t.Fatalf("unexpected avatar_url: %v", aData["avatar_url"])
	}

	// Avatar upload with invalid file (e.g. text/html) rejected
	htmlBytes := []byte("<html><body>Not an image</body></html>")
	badRes := c.callMultipart("POST", "/api/v1/profile/avatar", token, "avatar", "script.html", htmlBytes)
	if badRes.Status != http.StatusBadRequest {
		t.Fatalf("expected 400 for non-image avatar, got %d", badRes.Status)
	}
}

// 5. Vacancies Search, Filtering, and Sitemap
func TestVacanciesSearchAndFilters(t *testing.T) {
	c, _ := setup(t)
	emp, _ := register(c, "TechCorp")

	// Create vacancies
	v1 := c.mustOK(c.call("POST", "/api/v1/vacancies", emp, map[string]string{
		"title":       "Senior Python Developer",
		"company":     "TechCorp",
		"description": "Python, Django, FastAPI",
		"location":    "Samarqand",
		"salary":      "15 000 000 UZS",
	}), "create v1")["vacancy"].(map[string]any)
	v1ID := v1["id"].(string)

	// Single vacancy GET
	single := c.mustOK(c.call("GET", "/api/v1/vacancies/"+v1ID, "", nil), "get single vacancy")["vacancy"].(map[string]any)
	if single["title"] != "Senior Python Developer" {
		t.Fatalf("unexpected vacancy title: %v", single["title"])
	}

	// 404 for nonexistent vacancy
	fakeID := uuid.NewString()
	res404 := c.call("GET", "/api/v1/vacancies/"+fakeID, "", nil)
	if res404.Status != http.StatusNotFound {
		t.Fatalf("expected 404 for missing vacancy, got %d", res404.Status)
	}

	// Search by keyword
	searchRes := c.mustOK(c.call("GET", "/api/v1/vacancies?search=Python", "", nil), "search python")
	vacanciesList := searchRes["vacancies"].([]any)
	if len(vacanciesList) == 0 {
		t.Fatalf("expected to find python vacancies, got none")
	}

	// Filter by location
	locRes := c.mustOK(c.call("GET", "/api/v1/vacancies?location=Samarqand", "", nil), "filter location")
	if len(locRes["vacancies"].([]any)) == 0 {
		t.Fatalf("expected vacancies in Samarqand")
	}

	// Sitemap check
	sitemapData := c.mustOK(c.call("GET", "/api/v1/vacancies/sitemap", "", nil), "sitemap")
	vacanciesSitemap := sitemapData["vacancies"].([]any)
	if len(vacanciesSitemap) == 0 {
		t.Fatalf("expected non-empty sitemap")
	}
}

// 6. Comments full lifecycle
func TestCommentsLifecycle(t *testing.T) {
	c, _ := setup(t)
	emp, _ := register(c, "EmployerComments")
	cand, _ := register(c, "CandidateComments")

	vac := c.mustOK(c.call("POST", "/api/v1/vacancies", emp, map[string]string{
		"title": "Flutter Developer", "company": "MobileCo", "description": "Dart va Flutter",
	}), "create vac")["vacancy"].(map[string]any)
	vacID := vac["id"].(string)

	// Post comment
	c.mustOK(c.call("POST", "/api/v1/vacancies/"+vacID+"/comments", cand, map[string]string{
		"content": "Masofadan ishlash imkoni bormi?",
	}), "post comment")

	// List vacancy comments
	vComments := c.mustOK(c.call("GET", "/api/v1/vacancies/"+vacID+"/comments", "", nil), "vacancy comments")
	items := vComments["comments"].([]any)
	if len(items) != 1 || !strings.Contains(items[0].(map[string]any)["content"].(string), "Masofadan") {
		t.Fatalf("unexpected vacancy comments: %v", items)
	}

	// List recent comments
	recentRes := c.mustOK(c.call("GET", "/api/v1/comments/recent", "", nil), "recent comments")
	recentList := recentRes["comments"].([]any)
	if len(recentList) == 0 {
		t.Fatalf("expected recent comments, got none")
	}
}

// 7. Resumes CRUD and File Upload
func TestResumeCRUDAndUpload(t *testing.T) {
	c, _ := setup(t)
	token, _ := register(c, "ResumeCandidate")

	// Create resume
	created := c.mustOK(c.call("POST", "/api/v1/resumes", token, map[string]string{
		"title":   "DevOps Engineer",
		"summary": "Kubernetes, Docker, CI/CD",
	}), "create resume")["resume"].(map[string]any)
	resID := created["id"].(string)

	// Get resume
	got := c.mustOK(c.call("GET", "/api/v1/resumes/"+resID, token, nil), "get resume")["resume"].(map[string]any)
	if got["title"] != "DevOps Engineer" {
		t.Fatalf("title mismatch: %v", got)
	}

	// Update resume
	updated := c.mustOK(c.call("PUT", "/api/v1/resumes/"+resID, token, map[string]string{
		"title":   "Senior DevOps Engineer",
		"summary": "Kubernetes, Terraform, AWS, CI/CD",
	}), "update resume")["resume"].(map[string]any)
	if updated["title"] != "Senior DevOps Engineer" {
		t.Fatalf("updated title mismatch: %v", updated)
	}

	// Upload resume text file
	resumeFileBytes := []byte("Curriculum Vitae: Senior DevOps Engineer with 5 years experience.")
	uploadRes := c.callMultipart("POST", "/api/v1/resumes/upload", token, "file", "cv.txt", resumeFileBytes)
	uData := c.mustOK(uploadRes, "upload resume file")
	if uData["file_url"] == "" || uData["resume"] == nil {
		t.Fatalf("upload resume file response invalid: %v", uData)
	}
	uploadedID := uData["resume"].(map[string]any)["id"].(string)

	// Delete resumes
	c.mustOK(c.call("DELETE", "/api/v1/resumes/"+resID, token, nil), "delete resume")
	c.mustOK(c.call("DELETE", "/api/v1/resumes/"+uploadedID, token, nil), "delete uploaded resume")

	// Get deleted resume returns 404
	afterDelete := c.call("GET", "/api/v1/resumes/"+resID, token, nil)
	if afterDelete.Status != http.StatusNotFound {
		t.Fatalf("expected 404 for deleted resume, got %d", afterDelete.Status)
	}
}

// 8. Notification mark as read
func TestNotificationReadFlow(t *testing.T) {
	c, db := setup(t)
	token, userID := register(c, "NotifyUser")

	// Insert test notification directly
	notifID := uuid.NewString()
	_, err := db.Exec(`INSERT INTO notifications (id, user_id, title, body, created_at) VALUES ($1, $2, $3, $4, NOW())`,
		notifID, userID, "Yangi xabar", "Sizga yangi ariza kelib tushdi")
	if err != nil {
		t.Fatalf("insert notification: %v", err)
	}

	// List notifications
	listData := c.mustOK(c.call("GET", "/api/v1/notifications", token, nil), "list notifications")
	if listData["unread_count"].(float64) < 1 {
		t.Fatalf("expected at least 1 unread notification")
	}

	// Mark as read
	c.mustOK(c.call("PATCH", "/api/v1/notifications/"+notifID+"/read", token, nil), "mark read")

	// Verify unread count is 0
	listAfter := c.mustOK(c.call("GET", "/api/v1/notifications", token, nil), "list notifications after read")
	if listAfter["unread_count"].(float64) != 0 {
		t.Fatalf("expected 0 unread notifications after read, got %v", listAfter["unread_count"])
	}
}

// 9. Billing complete flow & webhooks
func TestBillingCompleteFlow(t *testing.T) {
	c, _ := setup(t)
	token, userID := register(c, "BillingUser")

	// Plans list
	plansData := c.mustOK(c.call("GET", "/api/v1/billing/plans", "", nil), "get plans")
	plans := plansData["plans"].([]any)
	if len(plans) != 3 {
		t.Fatalf("expected 3 plans, got %d", len(plans))
	}

	// My subscription initial
	mySub := c.mustOK(c.call("GET", "/api/v1/billing/my-subscription", token, nil), "my sub initial")
	sub := mySub["subscription"].(map[string]any)
	if sub["plan"] != "free" || sub["status"] != "active" {
		t.Fatalf("expected initial free plan: %v", sub)
	}

	// Subscribe to free plan
	subFree := c.mustOK(c.call("POST", "/api/v1/billing/subscribe", token, map[string]string{
		"plan": "free",
	}), "subscribe free")
	if subFree["subscription"].(map[string]any)["status"] != "active" {
		t.Fatalf("free plan should be active immediately")
	}

	// Subscribe to invalid plan rejected
	badSub := c.call("POST", "/api/v1/billing/subscribe", token, map[string]string{
		"plan": "invalid_plan_123",
	})
	if badSub.Status != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid plan, got %d", badSub.Status)
	}

	// Subscribe to pro with Click provider
	t.Setenv("CLICK_SERVICE_ID", "12345")
	t.Setenv("CLICK_MERCHANT_ID", "67890")
	proSub := c.mustOK(c.call("POST", "/api/v1/billing/subscribe", token, map[string]string{
		"plan":     "pro",
		"provider": "click",
	}), "subscribe pro")
	payInfo := proSub["payment"].(map[string]any)
	if payInfo["status"] != "pending" || !strings.Contains(payInfo["checkout_url"].(string), "click.uz") {
		t.Fatalf("unexpected pro payment info: %v", payInfo)
	}

	// Webhook: generic payment webhook with secret
	t.Setenv("PAYMENT_WEBHOOK_SECRET", "super_webhook_secret_key")

	// Unauthorized without secret
	unauthWebhook := c.call("POST", "/api/v1/billing/webhook", "", map[string]string{
		"user_id": userID, "plan": "enterprise",
	})
	if unauthWebhook.Status != http.StatusUnauthorized {
		t.Fatalf("expected 401 without secret, got %d", unauthWebhook.Status)
	}

	// Authorized with secret
	var authBuf bytes.Buffer
	_ = json.NewEncoder(&authBuf).Encode(map[string]string{
		"user_id": userID, "plan": "enterprise", "provider": "stripe",
	})
	authReq := httptest.NewRequest("POST", "/api/v1/billing/webhook", &authBuf)
	authReq.Header.Set("Content-Type", "application/json")
	authReq.Header.Set("X-Webhook-Secret", "super_webhook_secret_key")
	c.ip++
	authReq.RemoteAddr = fmt.Sprintf("10.1.%d.%d:1234", c.ip/250, c.ip%250+1)
	authRec := httptest.NewRecorder()
	c.router.ServeHTTP(authRec, authReq)
	if authRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for authorized webhook, got %d", authRec.Code)
	}

	// Payme Webhook JSON-RPC check
	t.Setenv("PAYME_KEY", "test_payme_key_123")
	paymeAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte("Paycom:test_payme_key_123"))

	paymeReqBody := map[string]any{
		"method": "CheckPerformTransaction",
		"params": map[string]any{"account": map[string]string{"user_id": userID}, "amount": 25000000},
		"id":     101,
	}
	var buf bytes.Buffer
	_ = json.NewEncoder(&buf).Encode(paymeReqBody)
	req := httptest.NewRequest("POST", "/api/v1/billing/payme", &buf)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", paymeAuth)
	rec := httptest.NewRecorder()
	c.router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("payme check perform returned HTTP %d", rec.Code)
	}
	var paymeResp map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &paymeResp)
	if result, ok := paymeResp["result"].(map[string]any); !ok || result["allow"] != true {
		t.Fatalf("unexpected payme result: %v", paymeResp)
	}
}

// 10. Chat Endpoints & Messaging
func TestChatCompleteFlow(t *testing.T) {
	c, _ := setup(t)
	token, _ := register(c, "ChatUser")

	// Chat health
	healthRes := c.mustOK(c.call("GET", "/api/v1/chat/health", "", nil), "chat health")
	if healthRes["status"] != "chat-enabled" {
		t.Fatalf("chat status not enabled: %v", healthRes)
	}

	// Chat rooms
	roomsRes := c.mustOK(c.call("GET", "/api/v1/chat/rooms", "", nil), "chat rooms")
	rooms := roomsRes["rooms"].([]any)
	if len(rooms) != 4 {
		t.Fatalf("expected 4 chat rooms, got %d", len(rooms))
	}

	// Send message to public room
	sendRes := c.mustOK(c.call("POST", "/api/v1/chat/messages", token, map[string]string{
		"room_id": "general",
		"content": "Salom barchaga! Antigravity orqali test qilinmoqda.",
	}), "send message")
	msgData := sendRes["message"].(map[string]any)
	if msgData["content"] != "Salom barchaga! Antigravity orqali test qilinmoqda." {
		t.Fatalf("unexpected sent message: %v", msgData)
	}

	// List room messages
	listRes := c.mustOK(c.call("GET", "/api/v1/chat/messages?room=general", token, nil), "list messages")
	history := listRes["messages"].([]any)
	found := false
	for _, m := range history {
		if strings.Contains(m.(map[string]any)["content"].(string), "Antigravity") {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("sent message not found in history: %v", history)
	}
}

// 11. Admin Access Control & Analytics
func TestAdminAccessControlAndAnalytics(t *testing.T) {
	c, db := setup(t)
	userToken, userID := register(c, "RegularUser")

	// Regular user denied
	userListDenied := c.call("GET", "/api/v1/admin/users", userToken, nil)
	if userListDenied.Status != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for regular user on /admin/users, got %d", userListDenied.Status)
	}
	analyticsDenied := c.call("GET", "/api/v1/admin/analytics", userToken, nil)
	if analyticsDenied.Status != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for regular user on /admin/analytics, got %d", analyticsDenied.Status)
	}

	// Elevate to admin in database and issue admin JWT
	_, err := db.Exec(`UPDATE users SET role = 'admin' WHERE id = $1`, userID)
	if err != nil {
		t.Fatalf("promote user to admin: %v", err)
	}
	adminToken, err := jwt.GenerateToken(userID, "admin@test.local", "admin")
	if err != nil {
		t.Fatalf("generate admin token: %v", err)
	}

	// Admin accesses /admin/users
	usersData := c.mustOK(c.call("GET", "/api/v1/admin/users", adminToken, nil), "admin list users")
	usersList := usersData["users"].([]any)
	if len(usersList) == 0 {
		t.Fatalf("expected non-empty users list for admin")
	}

	// Admin accesses /admin/analytics
	analyticsData := c.mustOK(c.call("GET", "/api/v1/admin/analytics", adminToken, nil), "admin analytics")
	if analyticsData["total_users"] == nil || analyticsData["total_vacancies"] == nil {
		t.Fatalf("expected analytics counters, got: %v", analyticsData)
	}
}

// 12. Invalid IDs and Edge Cases: Endpoints should return 400 or 404, never 500 Internal Server Error
func TestInvalidUUIDsAndEdgeCases(t *testing.T) {
	c, _ := setup(t)
	token, _ := register(c, "EdgeCaseUser")

	badID := "invalid-uuid-format"

	endpoints := []struct {
		name   string
		method string
		path   string
		token  string
		body   any
	}{
		{"GetVacancy bad id", "GET", "/api/v1/vacancies/" + badID, "", nil},
		{"PutVacancy bad id", "PUT", "/api/v1/vacancies/" + badID, token, map[string]string{"title": "x"}},
		{"DeleteVacancy bad id", "DELETE", "/api/v1/vacancies/" + badID, token, nil},
		{"ApplyVacancy bad id", "POST", "/api/v1/vacancies/" + badID + "/apply", token, map[string]string{"cover_letter": "x"}},
		{"CommentsVacancy bad id", "GET", "/api/v1/vacancies/" + badID + "/comments", "", nil},
		{"CreateCommentVacancy bad id", "POST", "/api/v1/vacancies/" + badID + "/comments", token, map[string]string{"content": "x"}},
		{"GetResume bad id", "GET", "/api/v1/resumes/" + badID, token, nil},
		{"PutResume bad id", "PUT", "/api/v1/resumes/" + badID, token, map[string]string{"title": "x"}},
		{"DeleteResume bad id", "DELETE", "/api/v1/resumes/" + badID, token, nil},
		{"PatchApplicationStatus bad id", "PATCH", "/api/v1/applications/" + badID + "/status", token, map[string]string{"status": "accepted"}},
		{"PatchNotificationRead bad id", "PATCH", "/api/v1/notifications/" + badID + "/read", token, nil},
	}

	for _, ep := range endpoints {
		t.Run(ep.name, func(t *testing.T) {
			res := c.call(ep.method, ep.path, ep.token, ep.body)
			if res.Status >= 500 {
				t.Errorf("%s returned HTTP %d Internal Server Error for invalid UUID input! Expected 400 or 404. Error: %s", ep.name, res.Status, res.Error)
			}
		})
	}
}
