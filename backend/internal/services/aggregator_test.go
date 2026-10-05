package services

import "testing"

func intPtr(n int) *int { return &n }

func TestHHMapping(t *testing.T) {
	var v hhVacancy
	v.Salary = &struct {
		From     *int   `json:"from"`
		To       *int   `json:"to"`
		Currency string `json:"currency"`
	}{From: intPtr(8000000), To: intPtr(12000000), Currency: "UZS"}
	if got := hhSalary(v); got != "8 000 000 - 12 000 000 UZS" {
		t.Errorf("hhSalary = %q", got)
	}
	v.Salary = nil
	if got := hhSalary(v); got != "Kelishilgan" {
		t.Errorf("hhSalary(nil) = %q", got)
	}
	v.WorkFormat = []struct {
		ID string `json:"id"`
	}{{ID: "REMOTE"}}
	if got := hhJobType(v); got != "Remote" {
		t.Errorf("hhJobType = %q", got)
	}

	cases := map[string]string{
		"Ташкент":   "Toshkent shahri",
		"Самарканд": "Samarqand viloyati",
		"Нукус":     "Qoraqalpog‘iston Respublikasi",
		"Чирчик":    "Toshkent viloyati",
	}
	for in, want := range cases {
		if got := normalizeRegion(in); got != want {
			t.Errorf("normalizeRegion(%q) = %q, want %q", in, got, want)
		}
	}

	if got := categorizeVacancy("Backend-разработчик (Go)"); got != "IT & Dasturlash" {
		t.Errorf("categorizeVacancy = %q", got)
	}
	if got := stripHH("Опыт работы с <highlighttext>Go</highlighttext> &amp; SQL"); got != "Опыт работы с Go & SQL" {
		t.Errorf("stripHH = %q", got)
	}
}
