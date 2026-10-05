package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// Vacancy aggregator: imports fresh vacancies for Uzbekistan from the official hh.ru API
// (https://api.hh.ru, area 97). The API requires an application token, obtained by
// registering an app at https://dev.hh.ru and set via HH_APP_TOKEN, or HH_CLIENT_ID +
// HH_CLIENT_SECRET (exchanged for an app token on start).

const (
	hhAPIBase      = "https://api.hh.ru"
	hhAreaUzbekist = "97"
	hhPerPage      = 100
	hhMaxPages     = 20 // hh returns at most 2000 results per query
	hhSource       = "hh.uz"
)

type AggregatorConfig struct {
	Interval     time.Duration
	AppToken     string
	ClientID     string
	ClientSecret string
	UserAgent    string
}

// AggregatorConfigFromEnv reads aggregator settings; ok is false when no hh credentials are configured.
func AggregatorConfigFromEnv() (cfg AggregatorConfig, ok bool) {
	cfg = AggregatorConfig{
		Interval:     time.Minute,
		AppToken:     strings.TrimSpace(os.Getenv("HH_APP_TOKEN")),
		ClientID:     strings.TrimSpace(os.Getenv("HH_CLIENT_ID")),
		ClientSecret: strings.TrimSpace(os.Getenv("HH_CLIENT_SECRET")),
		UserAgent:    strings.TrimSpace(os.Getenv("HH_USER_AGENT")),
	}
	if d, err := time.ParseDuration(os.Getenv("SCRAPER_INTERVAL")); err == nil && d >= time.Minute {
		cfg.Interval = d
	}
	if cfg.UserAgent == "" {
		cfg.UserAgent = "WZone/1.0"
	}
	return cfg, cfg.AppToken != "" || (cfg.ClientID != "" && cfg.ClientSecret != "")
}

type aggregator struct {
	cfg      AggregatorConfig
	db       *sql.DB
	rdb      *redis.Client
	client   *http.Client
	token    string
	lastSync time.Time
}

// StartBackgroundAggregator syncs vacancies immediately and then every cfg.Interval.
func StartBackgroundAggregator(db *sql.DB, rdb *redis.Client, cfg AggregatorConfig) {
	if db == nil {
		log.Println("[Aggregator] disabled: no database connection")
		return
	}
	a := &aggregator{cfg: cfg, db: db, rdb: rdb, client: &http.Client{Timeout: 20 * time.Second}, token: cfg.AppToken}
	go func() {
		time.Sleep(10 * time.Second)
		ticker := time.NewTicker(cfg.Interval)
		defer ticker.Stop()
		for {
			a.sync()
			<-ticker.C
		}
	}()
	log.Printf("[Aggregator] hh.uz sync enabled, every %s", cfg.Interval)
}

func (a *aggregator) sync() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	if a.token == "" {
		tok, err := a.fetchAppToken(ctx)
		if err != nil {
			log.Printf("[Aggregator] cannot obtain hh app token: %v", err)
			return
		}
		a.token = tok
	}

	started := time.Now()
	// After the first full sweep only ask for postings newer than the previous run (with overlap)
	var dateFrom time.Time
	if !a.lastSync.IsZero() {
		dateFrom = a.lastSync.Add(-15 * time.Minute)
	}

	upserted, inserted := 0, 0
	for page := 0; page < hhMaxPages; page++ {
		items, pages, err := a.fetchPage(ctx, page, dateFrom)
		if err != nil {
			log.Printf("[Aggregator] page %d failed: %v", page, err)
			break
		}
		for _, it := range items {
			isNew, err := a.upsert(ctx, it)
			if err != nil {
				log.Printf("[Aggregator] upsert hh vacancy %s: %v", it.ID, err)
				continue
			}
			upserted++
			if isNew {
				inserted++
			}
		}
		if page+1 >= pages {
			break
		}
		time.Sleep(300 * time.Millisecond)
	}

	if upserted > 0 {
		a.lastSync = started
	}
	if inserted > 0 {
		a.invalidateCache(ctx)
	}
	log.Printf("[Aggregator] hh.uz sync done: %d new, %d updated in %s", inserted, upserted-inserted, time.Since(started).Round(time.Second))
}

func (a *aggregator) fetchAppToken(ctx context.Context) (string, error) {
	form := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {a.cfg.ClientID},
		"client_secret": {a.cfg.ClientSecret},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, hhAPIBase+"/token", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("HH-User-Agent", a.cfg.UserAgent)
	req.Header.Set("User-Agent", a.cfg.UserAgent)
	resp, err := a.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var body struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
		Description string `json:"error_description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", fmt.Errorf("status %d: %w", resp.StatusCode, err)
	}
	if body.AccessToken == "" {
		return "", fmt.Errorf("status %d: %s %s", resp.StatusCode, body.Error, body.Description)
	}
	return body.AccessToken, nil
}

type hhVacancy struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Area struct {
		Name string `json:"name"`
	} `json:"area"`
	Salary *struct {
		From     *int   `json:"from"`
		To       *int   `json:"to"`
		Currency string `json:"currency"`
	} `json:"salary"`
	Employer struct {
		Name     string            `json:"name"`
		LogoURLs map[string]string `json:"logo_urls"`
	} `json:"employer"`
	Snippet struct {
		Requirement    string `json:"requirement"`
		Responsibility string `json:"responsibility"`
	} `json:"snippet"`
	Schedule *struct {
		ID string `json:"id"`
	} `json:"schedule"`
	WorkFormat []struct {
		ID string `json:"id"`
	} `json:"work_format"`
	Employment *struct {
		ID string `json:"id"`
	} `json:"employment"`
	Experience *struct {
		ID string `json:"id"`
	} `json:"experience"`
	ProfessionalRoles []struct {
		Name string `json:"name"`
	} `json:"professional_roles"`
	PublishedAt  string `json:"published_at"`
	AlternateURL string `json:"alternate_url"`
}

func (a *aggregator) fetchPage(ctx context.Context, page int, dateFrom time.Time) ([]hhVacancy, int, error) {
	q := url.Values{
		"area":     {hhAreaUzbekist},
		"per_page": {strconv.Itoa(hhPerPage)},
		"page":     {strconv.Itoa(page)},
		"order_by": {"publication_time"},
	}
	if !dateFrom.IsZero() {
		q.Set("date_from", dateFrom.Format("2006-01-02T15:04:05-0700"))
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, hhAPIBase+"/vacancies?"+q.Encode(), nil)
	if err != nil {
		return nil, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+a.token)
	req.Header.Set("HH-User-Agent", a.cfg.UserAgent)
	req.Header.Set("User-Agent", a.cfg.UserAgent)
	resp, err := a.client.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		// Token revoked/invalid: retry the client-credentials exchange on the next run
		if a.cfg.ClientID != "" {
			a.token = ""
		}
		return nil, 0, fmt.Errorf("hh API returned %d (check HH_APP_TOKEN / HH_CLIENT_ID)", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, 0, fmt.Errorf("hh API returned %d", resp.StatusCode)
	}
	var body struct {
		Items []hhVacancy `json:"items"`
		Pages int         `json:"pages"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, 0, err
	}
	return body.Items, body.Pages, nil
}

func (a *aggregator) upsert(ctx context.Context, it hhVacancy) (inserted bool, err error) {
	title := strings.TrimSpace(it.Name)
	if it.ID == "" || title == "" {
		return false, nil
	}
	company := strings.TrimSpace(it.Employer.Name)
	if company == "" {
		company = "—"
	}
	desc := joinNonEmpty("\n\n", stripHH(it.Snippet.Responsibility), stripHH(it.Snippet.Requirement))
	if desc == "" {
		desc = title
	}
	roles := make([]string, 0, len(it.ProfessionalRoles))
	for _, r := range it.ProfessionalRoles {
		roles = append(roles, r.Name)
	}
	category := categorizeVacancy(title + " " + strings.Join(roles, " ") + " " + desc)
	location := normalizeRegion(it.Area.Name + " " + title)
	jobType := hhJobType(it)
	tags := joinNonEmpty(", ", strings.Split(category, " & ")[0], jobType, strings.Fields(location)[0])

	createdAt, perr := time.Parse("2006-01-02T15:04:05-0700", it.PublishedAt)
	if perr != nil || createdAt.After(time.Now().Add(time.Hour)) {
		createdAt = time.Now().UTC()
	}

	err = a.db.QueryRowContext(ctx, `
		INSERT INTO vacancies (
			id, title, company, location, description, salary, category, job_type, experience, tags,
			company_logo, is_verified, is_featured, views_count, source, external_id, source_url, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, false, 0, $12, $13, $14, $15, NOW())
		ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL DO UPDATE SET
			title = EXCLUDED.title, company = EXCLUDED.company, location = EXCLUDED.location,
			description = EXCLUDED.description, salary = EXCLUDED.salary, category = EXCLUDED.category,
			job_type = EXCLUDED.job_type, experience = EXCLUDED.experience, tags = EXCLUDED.tags,
			company_logo = EXCLUDED.company_logo, source_url = EXCLUDED.source_url, updated_at = NOW()
		RETURNING (xmax = 0)`,
		uuid.NewString(), truncate(title, 255), truncate(company, 255), truncate(location, 255), desc,
		truncate(hhSalary(it), 100), category, jobType, hhExperience(it), truncate(tags, 255),
		it.Employer.LogoURLs["90"], hhSource, it.ID, it.AlternateURL, createdAt,
	).Scan(&inserted)
	return inserted, err
}

func (a *aggregator) invalidateCache(ctx context.Context) {
	if a.rdb == nil {
		return
	}
	iter := a.rdb.Scan(ctx, 0, "vacancies:*", 200).Iterator()
	for iter.Next(ctx) {
		_ = a.rdb.Del(ctx, iter.Val()).Err()
	}
}

var hhTagRe = regexp.MustCompile(`<[^>]+>`)

func stripHH(s string) string {
	return strings.TrimSpace(html.UnescapeString(hhTagRe.ReplaceAllString(s, "")))
}

func joinNonEmpty(sep string, parts ...string) string {
	out := parts[:0:0]
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return strings.Join(out, sep)
}

func truncate(s string, n int) string {
	if r := []rune(s); len(r) > n {
		return string(r[:n])
	}
	return s
}

func hhSalary(it hhVacancy) string {
	if it.Salary == nil || (it.Salary.From == nil && it.Salary.To == nil) {
		return "Kelishilgan"
	}
	cur := it.Salary.Currency
	if cur == "UZS" || cur == "" {
		cur = "UZS"
	}
	switch {
	case it.Salary.From != nil && it.Salary.To != nil:
		return fmt.Sprintf("%s - %s %s", groupThousands(*it.Salary.From), groupThousands(*it.Salary.To), cur)
	case it.Salary.From != nil:
		return fmt.Sprintf("%s %s dan", groupThousands(*it.Salary.From), cur)
	default:
		return fmt.Sprintf("%s %s gacha", groupThousands(*it.Salary.To), cur)
	}
}

func groupThousands(n int) string {
	s := strconv.Itoa(n)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(' ')
		}
		b.WriteRune(c)
	}
	return b.String()
}

func hhJobType(it hhVacancy) string {
	for _, f := range it.WorkFormat {
		switch f.ID {
		case "REMOTE":
			return "Remote"
		case "HYBRID":
			return "Gibrid"
		}
	}
	if it.Schedule != nil {
		switch it.Schedule.ID {
		case "remote":
			return "Remote"
		case "flexible":
			return "Gibrid"
		}
	}
	if it.Employment != nil && (it.Employment.ID == "part" || it.Employment.ID == "probation") {
		return "Part-time"
	}
	return "Full-time"
}

func hhExperience(it hhVacancy) string {
	if it.Experience == nil {
		return "1-3 yil"
	}
	switch it.Experience.ID {
	case "noExperience":
		return "Talab etilmaydi"
	case "between3And6":
		return "3-5 yil"
	case "moreThan6":
		return "5+ yil"
	default:
		return "1-3 yil"
	}
}

// normalizeRegion maps an hh area/city name onto the portal's region list.
func normalizeRegion(text string) string {
	t := strings.ToLower(text)
	has := func(keys ...string) bool {
		for _, k := range keys {
			if strings.Contains(t, k) {
				return true
			}
		}
		return false
	}
	switch {
	case has("remote", "masofaviy", "удален"):
		return "Masofaviy (Remote)"
	case has("samarqand", "самарканд"):
		return "Samarqand viloyati"
	case has("buxoro", "бухар"):
		return "Buxoro viloyati"
	case has("farg", "ферган", "qo‘qon", "коканд", "маргилан"):
		return "Farg‘ona viloyati"
	case has("andijon", "андижан"):
		return "Andijon viloyati"
	case has("namangan", "наманган"):
		return "Namangan viloyati"
	case has("xorazm", "urganch", "хорезм", "ургенч", "хива"):
		return "Xorazm viloyati"
	case has("qashqadaryo", "qarshi", "карши", "кашкадар", "шахрисабз"):
		return "Qashqadaryo viloyati"
	case has("surxondaryo", "termiz", "термез", "сурхандар"):
		return "Surxondaryo viloyati"
	case has("jizzax", "джизак"):
		return "Jizzax viloyati"
	case has("sirdaryo", "guliston", "сырдар", "гулистан"):
		return "Sirdaryo viloyati"
	case has("navoiy", "навои", "зарафшан"):
		return "Navoiy viloyati"
	case has("qoraqalpo", "nukus", "каракалпак", "нукус"):
		return "Qoraqalpog‘iston Respublikasi"
	case has("toshkent vil", "ташкентская", "чирчик", "ангрен", "алмалык", "янгиюль"):
		return "Toshkent viloyati"
	}
	return "Toshkent shahri"
}

var categoryKeywords = []struct {
	name string
	keys []string
}{
	{"Tibbiyot & Salomatlik", []string{"врач", "медсест", "фармацевт", "провизор", "стоматолог", "shifokor", "hamshira", "doctor", "nurse", "медицин"}},
	{"IT & Dasturlash", []string{"developer", "разработчик", "программист", "dasturchi", "engineer", "frontend", "backend", "golang", "python", "java", "react", "flutter", "devops", "qa ", "тестировщик", "data", "аналитик данных", "full-stack", "fullstack", "1с", "1c", "php", "ios", "android", "системный администратор"}},
	{"Dizayn & UX", []string{"дизайн", "design", "ui/ux", "figma", "grafik", "motion"}},
	{"Marketing & Savdo", []string{"marketing", "маркет", "smm", "sales", "продаж", "торгов", "savdo", "reklama", "реклам", "seo", "таргет"}},
	{"Moliya & Buxgalteriya", []string{"бухгалтер", "buxgalter", "финанс", "moliya", "аудит", "кассир", "accountant", "finance", "экономист", "кредит"}},
	{"Mijozlarga xizmat", []string{"оператор", "operator", "call", "колл", "поддержк", "консультант", "администратор зала", "ресепшн"}},
	{"Qurilish & Ishlab chiqarish", []string{"строит", "qurilish", "инженер", "muhandis", "производ", "технолог", "завод", "электрик", "сварщик", "монтаж", "механик"}},
	{"Transport & Logistika", []string{"водитель", "haydovchi", "курьер", "kuryer", "логист", "склад", "driver", "экспедитор"}},
	{"Ta’lim", []string{"учитель", "преподават", "o‘qituvchi", "teacher", "mentor", "ментор", "репетитор", "педагог"}},
	{"Servis & Xizmat ko‘rsatish", []string{"повар", "официант", "бариста", "уборщ", "горничн", "oshpaz", "ofitsiant", "парикмахер", "охран"}},
	{"HR & Menejment", []string{"hr", "рекрут", "recruiter", "менеджер", "manager", "директор", "руководит", "head of", "администратор"}},
}

func categorizeVacancy(text string) string {
	t := strings.ToLower(text)
	for _, c := range categoryKeywords {
		for _, k := range c.keys {
			if strings.Contains(t, k) {
				return c.name
			}
		}
	}
	return "Servis & Xizmat ko‘rsatish"
}
