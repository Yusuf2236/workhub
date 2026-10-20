package handlers

import (
	"strings"
	"testing"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

func TestRedactResumeHidesContacts(t *testing.T) {
	r := redactResume(models.Resume{
		Summary: "Email: ali.valiyev@gmail.com\nTel: +998 90 123-45-67\nTelegram: @ali_dev\nTajriba: 2019 - 2023",
		FileURL: "/uploads/resumes/x.pdf",
	})
	for _, leaked := range []string{"ali.valiyev@gmail.com", "123-45-67", "@ali_dev"} {
		if strings.Contains(r.Summary, leaked) {
			t.Errorf("summary still contains %q: %s", leaked, r.Summary)
		}
	}
	if !strings.Contains(r.Summary, "2019 - 2023") {
		t.Errorf("year range should be kept: %s", r.Summary)
	}
	if r.FileURL != "" {
		t.Errorf("file url should be hidden, got %q", r.FileURL)
	}
}

func TestContainsWordMatchesWholeWords(t *testing.T) {
	if containsWord("Google Ads mutaxassisi", "go") {
		t.Error(`"go" must not match "Google"`)
	}
	if !containsWord("Backend (Go, PostgreSQL)", "go") {
		t.Error(`"go" should match "Go,"`)
	}
	if !containsWord("Next.js dasturchi", "next.js") {
		t.Error("next.js should match")
	}
}
