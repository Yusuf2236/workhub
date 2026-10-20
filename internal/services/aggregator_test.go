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

func TestCategorizeVacancyTitles(t *testing.T) {
	cases := map[string]string{
		"Оператор колл-центра (НОЧНАЯ СМЕНА)":                   "Mijozlarga xizmat",
		"Tikuv sexiga ayollarni tikuvchilarni ishga taklif":     "Qurilish & Ishlab chiqarish",
		"Savdo agenti (Torgoviy predstavitel)":                  "Marketing & Savdo",
		"Taom yetkazib berishga kuryer":                         "Transport & Logistika",
		"Диспетчер (Logistika)":                                 "Transport & Logistika",
		"QA Engineer":                                           "IT & Dasturlash",
		"Python / FastAPI & Django Backend Muhandisi":           "IT & Dasturlash",
		"Texnik ofis muhandisi":                                 "Qurilish & Ishlab chiqarish",
		"Ищем сильного мобилографа / контент-мейкера":           "Marketing & Savdo",
		"Matematika o‘qituvchisi":                               "Ta’lim & Fan",
		"Sotuv menejeri (ta`lim sohasida)":                      "Marketing & Savdo",
		"Avtomoykaga ishchilar kerak":                           "Servis & Xizmat ko‘rsatish",
		"Credit visit studios":                                  "Servis & Xizmat ko‘rsatish", // no "it"/"ios" inside words
		"Three shifts":                                          "Servis & Xizmat ko‘rsatish", // no "hr" inside words
		"HR menejer":                                            "HR & Menejment",
		"Texnik Qo‘llab-quvvatlash Mutaxassisi (Helpdesk / L1)": "IT & Dasturlash",
		"Mebel sexida ish":                                      "Qurilish & Ishlab chiqarish",
		"Матрас тикиши биладигон ишчиларни ишга оламиз": "Qurilish & Ishlab chiqarish",
		"Kiberxavfsizlik Mutaxassisi (SOC Analyst)":     "IT & Dasturlash",
	}
	for title, want := range cases {
		if got := categorizeVacancy(title); got != want {
			t.Errorf("categorizeVacancy(%q) = %q, want %q", title, got, want)
		}
	}
}
