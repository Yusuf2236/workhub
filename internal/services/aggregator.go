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
	hhTimeLayout   = "2006-01-02T15:04:05-0700"
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
	baseURL  string
	// store saves one vacancy and reports whether it was new (a.upsert; replaced in tests)
	store func(ctx context.Context, it hhVacancy) (bool, error)
}

// StartBackgroundAggregator syncs vacancies immediately and then every cfg.Interval.
func StartBackgroundAggregator(db *sql.DB, rdb *redis.Client, cfg AggregatorConfig) {
	if db == nil {
		log.Println("[Aggregator] disabled: no database connection")
		return
	}
	a := &aggregator{cfg: cfg, db: db, rdb: rdb, client: &http.Client{Timeout: 20 * time.Second}, token: cfg.AppToken, baseURL: hhAPIBase}
	a.store = a.upsert
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

// hh returns at most hhMaxResults items for one search, so the first sync walks back one day
// at a time (splitting busier periods further) instead of asking for everything at once.
const (
	hhMaxResults  = hhPerPage * hhMaxPages
	hhInitialDays = 30 // hh keeps a vacancy published for 30 days
)

type syncStats struct{ inserted, updated int }

func (a *aggregator) sync() {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
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
	var stats syncStats
	var err error
	if a.lastSync.IsZero() {
		to := started
		for day := 0; day < hhInitialDays && err == nil; day++ {
			from := to.Add(-24 * time.Hour)
			err = a.syncWindow(ctx, from, to, &stats)
			to = from
		}
	} else {
		// Overlap with the previous run so postings published during it are not missed
		err = a.syncWindow(ctx, a.lastSync.Add(-15*time.Minute), started, &stats)
	}

	if stats.inserted > 0 {
		a.invalidateCache(ctx)
	}
	if err != nil {
		// lastSync stays where it was, so the next run fetches this period again
		log.Printf("[Aggregator] hh.uz sync stopped: %v (%d new, %d updated so far)", err, stats.inserted, stats.updated)
		return
	}
	a.lastSync = started
	log.Printf("[Aggregator] hh.uz sync done: %d new, %d updated in %s", stats.inserted, stats.updated, time.Since(started).Round(time.Second))
}

// syncWindow imports every vacancy published between from and to.
func (a *aggregator) syncWindow(ctx context.Context, from, to time.Time, stats *syncStats) error {
	items, pages, found, err := a.fetchPage(ctx, 0, from, to)
	if err != nil {
		return err
	}
	if found > hhMaxResults && to.Sub(from) > time.Minute {
		mid := from.Add(to.Sub(from) / 2)
		if err := a.syncWindow(ctx, mid, to, stats); err != nil {
			return err
		}
		return a.syncWindow(ctx, from, mid, stats)
	}

	for page := 0; ; page++ {
		if page > 0 {
			time.Sleep(300 * time.Millisecond)
			if items, _, _, err = a.fetchPage(ctx, page, from, to); err != nil {
				return err
			}
		}
		for _, it := range items {
			isNew, err := a.store(ctx, it)
			if err != nil {
				log.Printf("[Aggregator] upsert hh vacancy %s: %v", it.ID, err)
				continue
			}
			if isNew {
				stats.inserted++
			} else {
				stats.updated++
			}
		}
		if page+1 >= pages || page+1 >= hhMaxPages {
			return nil
		}
	}
}

func (a *aggregator) fetchAppToken(ctx context.Context) (string, error) {
	form := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {a.cfg.ClientID},
		"client_secret": {a.cfg.ClientSecret},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, a.baseURL+"/token", strings.NewReader(form.Encode()))
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

// fetchPage returns one page of vacancies published between from and to, the page count
// and the total number of matches (which may exceed what hh lets us page through).
func (a *aggregator) fetchPage(ctx context.Context, page int, from, to time.Time) ([]hhVacancy, int, int, error) {
	q := url.Values{
		"area":      {hhAreaUzbekist},
		"per_page":  {strconv.Itoa(hhPerPage)},
		"page":      {strconv.Itoa(page)},
		"order_by":  {"publication_time"},
		"date_from": {from.Format(hhTimeLayout)},
		"date_to":   {to.Format(hhTimeLayout)},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, a.baseURL+"/vacancies?"+q.Encode(), nil)
	if err != nil {
		return nil, 0, 0, err
	}
	req.Header.Set("Authorization", "Bearer "+a.token)
	req.Header.Set("HH-User-Agent", a.cfg.UserAgent)
	req.Header.Set("User-Agent", a.cfg.UserAgent)
	resp, err := a.client.Do(req)
	if err != nil {
		return nil, 0, 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		// Token revoked/invalid: retry the client-credentials exchange on the next run
		if a.cfg.ClientID != "" {
			a.token = ""
		}
		return nil, 0, 0, fmt.Errorf("hh API returned %d (check HH_APP_TOKEN / HH_CLIENT_ID)", resp.StatusCode)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, 0, 0, fmt.Errorf("hh API returned %d", resp.StatusCode)
	}
	var body struct {
		Items []hhVacancy `json:"items"`
		Pages int         `json:"pages"`
		Found int         `json:"found"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, 0, 0, err
	}
	return body.Items, body.Pages, body.Found, nil
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
	tags := joinNonEmpty(", ", categoryTag(category), jobType, strings.Fields(location)[0])

	createdAt, perr := time.Parse(hhTimeLayout, it.PublishedAt)
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

// categoryKeywords maps words in a vacancy (Russian, Uzbek Latin/Cyrillic, English) to the
// portal's categories. Earlier entries win, so specific trades come before broad words
// like "менеджер"; finance and logistics precede IT so "1C" in "Buxgalter (1C)" does not win. Category names must match the web app's category list.
var categoryKeywords = []struct {
	name string
	keys []string
}{
	{"Tibbiyot & Salomatlik", []string{"врач", "медсест", "фармацевт", "провизор", "стоматолог", "shifokor", "hamshira", "doctor", "nurse", "медицин", "dorixona", "аптек"}},
	{"Moliya & Buxgalteriya", []string{"бухгалтер", "buxgalter", "финанс", "moliya", "аудит", "кассир", "kassir", "accountant", "finance", "экономист", "кредит"}},
	{"Transport & Logistika", []string{"водитель", "haydovchi", "курьер", "kuryer", "логист", "logist", "склад", "sklad", "driver", "экспедитор", "yetkazib", "ombor", "омбор", "диспетчер", "dispetcher"}},
	{"IT & Dasturlash", []string{"developer", "разработчик", "программист", "dasturchi", "frontend", "backend", "golang", "python", "java", "react", "flutter", "devops", "qa", "тестировщик", "data scien", "data engineer", "аналитик данных", "full-stack", "fullstack", "1с", "1c", "php", "ios", "android", "системный администратор", "sysadmin", "it", "software", "helpdesk", "kiberxavfsizlik", "кибербезопас", "telegram bot", "soc analyst"}},
	{"Dizayn & UX", []string{"дизайн", "design", "ui/ux", "figma", "grafik", "motion", "видеомонтаж", "montajchi"}},
	{"Ta’lim & Fan", []string{"учитель", "преподават", "o‘qituvchi", "o'qituvchi", "oqituvchi", "teacher", "mentor", "ментор", "репетитор", "педагог", "tarbiyachi", "воспитател", "ustoz"}},
	{"Mijozlarga xizmat", []string{"оператор", "operator", "call", "колл", "поддержк", "консультант", "konsultant", "ресепшн", "resepshn", "qo‘llab-quvvatlash", "qo'llab-quvvatlash"}},
	{"Qurilish & Ishlab chiqarish", []string{"строит", "qurilish", "инженер", "muhandis", "engineer", "производ", "ishlab chiqarish", "технолог", "завод", "zavod", "электрик", "elektrik", "сварщик", "svarshik", "монтаж", "механик", "mexanik", "tikuv", "швея", "швеи", "upakov", "упаков", "sex", "цех", "slesar", "слесар", "sexi", "sexga", "тикиш", "tikish", "текстил", "tekstil", "mebel", "мебел", "курилиш", "қурилиш", "ишлаб чиқар", "ishlab chig", "svarchik", "kafel", "кафел", "poyafzal", "обивщик", "обившик"}},
	{"Marketing & Savdo", []string{"marketing", "маркет", "smm", "sales", "продаж", "торгов", "savdo", "sotuv", "reklama", "реклам", "seo", "таргет", "target", "контент", "kontent", "мобилограф", "mobilograf", "agent", "агент", "promouter", "промоутер", "mobilag", "мобилаг"}},
	{"Servis & Xizmat ko‘rsatish", []string{"повар", "официант", "бариста", "уборщ", "горничн", "oshpaz", "ofitsiant", "парикмахер", "охран", "qorovul", "avtomoyka", "автомойк", "farrosh", "tozalash", "клининг", "kliner", "буфет", "restoran", "ресторан", "техничк", "fast food", "fasd fod"}},
	{"HR & Menejment", []string{"hr", "рекрут", "recruiter", "менеджер", "manager", "menejer", "директор", "direktor", "руководит", "rahbar", "head of", "администратор", "administrator", "adminstrator"}},
}

// categoryWordRe splits text into words; short ASCII keys ("hr", "qa", "ios") must match a whole word.
var categoryWordRe = regexp.MustCompile(`[\p{L}\p{N}]+`)

func categorizeVacancy(text string) string {
	t := strings.ToLower(text)
	words := map[string]bool{}
	for _, w := range categoryWordRe.FindAllString(t, -1) {
		words[w] = true
	}
	for _, c := range categoryKeywords {
		for _, k := range c.keys {
			if len(k) <= 3 && categoryWordRe.MatchString(k) && categoryWordRe.FindString(k) == k {
				if words[k] {
					return c.name
				}
				continue
			}
			if strings.Contains(t, k) {
				return c.name
			}
		}
	}
	return fallbackCategory
}

// fallbackCategory is used when no keyword matches
const fallbackCategory = "Servis & Xizmat ko‘rsatish"
