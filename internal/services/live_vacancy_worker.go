package services

import (
	"context"
	"database/sql"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

type LiveJobTemplate struct {
	Title       string
	Company     string
	Location    string
	Category    string
	JobType     string
	Experience  string
	Salary      string
	Tags        string
	Description string
}

var liveUzbekistanJobs = []LiveJobTemplate{
	{
		Title:       "Senior Golang Software Engineer",
		Company:     "Uzum Technologies",
		Location:    "Toshkent shahri",
		Category:    "IT & Dasturlash",
		JobType:     "Full-time",
		Experience:  "3-5 yil",
		Salary:      "28 000 000 - 45 000 000 UZS",
		Tags:        "Go, PostgreSQL, Redis, Kafka, Microservices, Docker",
		Description: "Uzum FinTech ekotizimida yuqori yuklamali (high-load) tranzaksiyalar servislarini ishlab chiqish uchun tajribali Go mutaxassisini taklif qilamiz. Talablar: Go (3+ yil), goroutine, kanal va xotira boshqaruvi, SQL optimallashtirish, k8s asoslari.",
	},
	{
		Title:       "Bosh Buxgalter (Chief Accountant)",
		Company:     "Orient Group",
		Location:    "Toshkent shahri",
		Category:    "Moliya & Buxgalteriya",
		JobType:     "Full-time",
		Experience:  "5+ yil",
		Salary:      "22 000 000 - 32 000 000 UZS",
		Tags:        "1C:Korxona 8.3, Soliq hisoboti, Didox, Milliy hisob standartlari, Audit",
		Description: "Yirik korxonada buxgalteriya bo‘limiga rahbarlik qilish. Barcha turdagi soliq hisobotlari, audit tekshiruvlari, moliyaviy oqimlar tahlili va jamoani boshqarish.",
	},
	{
		Title:       "Matematika va Tanqidiy Fikrlash Ustozi",
		Company:     "Registon Ta'lim Markazi",
		Location:    "Samarqand viloyati",
		Category:    "Ta’lim & Fan",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "8 000 000 - 16 000 000 UZS",
		Tags:        "Oliy matematika, DTM testlari, Abituriyentlar, Milliy sertifikat",
		Description: "Abituriyentlar va maktab o‘quvchilariga chuqurlashtirilgan matematika darslarini olib borish, test sinovlariga tayyorlash va o‘quvchilar natijalarini monitoring qilish.",
	},
	{
		Title:       "Senior React / Next.js Developer",
		Company:     "Payme (Inspired)",
		Location:    "Toshkent shahri",
		Category:    "IT & Dasturlash",
		JobType:     "Full-time",
		Experience:  "3-5 yil",
		Salary:      "25 000 000 - 38 000 000 UZS",
		Tags:        "React, TypeScript, Next.js, TailwindCSS, Redux Toolkit, Webpack",
		Description: "Payme veb-platformasi va yangi to‘lov xizmatlari interfeyslarini zamonaviy frontend texnologiyalarida yaratish va tezligini optimallashtirish.",
	},
	{
		Title:       "SMM & Performance Marketing Menejeri",
		Company:     "Korzinka (Anglesey Food)",
		Location:    "Toshkent shahri",
		Category:    "Marketing & Savdo",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "12 000 000 - 18 000 000 UZS",
		Tags:        "SMM, Meta Ads, Targetologiya, Copywriting, Reels, Analytics",
		Description: "Ijtimoiy tarmoqlarimizda auditoriyani kengaytirish, reklama kampaniyalarini ishga tushirish (Targeting) va kreativ kontent-rejani yuritish.",
	},
	{
		Title:       "Loyiha Boshqaruvchisi (Prorab)",
		Company:     "Murad Buildings",
		Location:    "Toshkent viloyati",
		Category:    "Qurilish & Ishlab chiqarish",
		JobType:     "Full-time",
		Experience:  "5+ yil",
		Salary:      "18 000 000 - 28 000 000 UZS",
		Tags:        "Bino qurilishi, Smeta, Qurilish nazorati, Xavfsizlik texnikasi, AutoCAD",
		Description: "Turar-joy majmuasi qurilish maydonida smena brigadalarini boshqarish, qurilish me'yorlariga (SNiP) muvofiqlikni ta'minlash va materiallar sarfini nazorat qilish.",
	},
	{
		Title:       "Katta Kredit Mutaxassisi (Scoring / Risk)",
		Company:     "Agrobank",
		Location:    "Farg‘ona viloyati",
		Category:    "Moliya & Buxgalteriya",
		JobType:     "Full-time",
		Experience:  "3-5 yil",
		Salary:      "14 000 000 - 22 000 000 UZS",
		Tags:        "Kredit tahlili, Biznes-reja, Garov baholash, Bank operatsiyalari",
		Description: "Yuridik va jismoniy shaxslarga kredit ajratish, moliyaviy barqarorlikni skoring qilish va kredit portfelini monitoring qilish.",
	},
	{
		Title:       "Ingliz Tili (IELTS 8.0+) Ustozi",
		Company:     "Cambridge Learning Centre",
		Location:    "Toshkent shahri",
		Category:    "Ta’lim & Fan",
		JobType:     "Part-time",
		Experience:  "1-3 yil",
		Salary:      "10 000 000 - 20 000 000 UZS",
		Tags:        "IELTS, Speaking, Writing, General English, Interactive teaching",
		Description: "IELTS guruhlariga Listening, Reading, Writing va Speaking bo‘yicha samarali uslubiy darslar o‘tish va qisqa muddatda yuqori ballga erishtirish.",
	},
	{
		Title:       "Logistika va Flot Menejeri",
		Company:     "Express24",
		Location:    "Toshkent shahri",
		Category:    "Transport & Logistika",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "11 000 000 - 17 000 000 UZS",
		Tags:        "Marshrut optimallashtirish, Kuryerlar boshqaruvi, GPS monitoring, KPI",
		Description: "Tezkor yetkazib berish xizmatida kuryerlar faoliyatini rejalashtirish, xaritalar bo‘yicha marshrutlarni optimallashtirish va yetkazish vaqtini qisqartirish.",
	},
	{
		Title:       "Shifokor Maslahatchi & Terapevt",
		Company:     "Akfa Medline",
		Location:    "Toshkent shahri",
		Category:    "Tibbiyot & Salomatlik",
		JobType:     "Full-time",
		Experience:  "3-5 yil",
		Salary:      "15 000 000 - 25 000 000 UZS",
		Tags:        "Terapiya, Bemorlar ko'rigi, Tibbiy protokollar, E-tibbiyot",
		Description: "Ambulator qabul, bemorlarga profilaktik va davolovchi maslahatlar berish, zamonaviy diagnostika usullari asosida muolaja rejalarini tuzish.",
	},
	{
		Title:       "B2B Savdo Bo‘limi Menejeri",
		Company:     "Texnomart",
		Location:    "Namangan viloyati",
		Category:    "Marketing & Savdo",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "9 000 000 - 20 000 000 UZS",
		Tags:        "Muzokaralar, Korporativ mijozlar, CRM, Bitimlar tuzish, Shartnomalar",
		Description: "Korxona va tashkilotlarga maishiy texnika va elektronika mahsulotlarini yetkazib berish bo‘yicha muzokaralar olib borish va shartnomalar tuzish.",
	},
	{
		Title:       "Middle DevOps Muhandis (CI/CD, Kubernetes)",
		Company:     "Click (Click.uz)",
		Location:    "Toshkent shahri",
		Category:    "IT & Dasturlash",
		JobType:     "Full-time",
		Experience:  "3-5 yil",
		Salary:      "24 000 000 - 36 000 000 UZS",
		Tags:        "Kubernetes, Docker, GitLab CI, Terraform, Prometheus, Linux",
		Description: "To‘lov tizimi infratuzilmasining uzluksiz ishlashini ta'minlash, avtomatlashtirilgan CI/CD quvurlarini sozlash va serverlar monitoringi.",
	},
	{
		Title:       "Kassir-Operator & Mijozlarga Xizmat Ko‘rsatuvchi",
		Company:     "Bellissimo Pizza",
		Location:    "Andijon viloyati",
		Category:    "Mijozlarga xizmat",
		JobType:     "Full-time",
		Experience:  "Talab etilmaydi",
		Salary:      "5 000 000 - 8 000 000 UZS",
		Tags:        "Kassa, R-Keeper, Xushmuomalalik, To'lovlar, Mijozlar bilan ishlash",
		Description: "Filialga kelgan mehmonlarga tez va xushmuomala xizmat ko‘rsatish, buyurtmalarni kassa tizimida rasmiylashtirish va hisob-kitob qilish.",
	},
	{
		Title:       "Flutter / Mobile Dasturchi",
		Company:     "Asaxiy.uz",
		Location:    "Toshkent shahri",
		Category:    "IT & Dasturlash",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "16 000 000 - 26 000 000 UZS",
		Tags:        "Flutter, Dart, Bloc, REST API, App Store, Google Play",
		Description: "Asaxiy Books va Asaxiy market ilovalarini ishlab chiqish, foydalanuvchilar qulayligini oshirish va yangi to‘lov tizimlarini integratsiya qilish.",
	},
	{
		Title:       "HR Menejer & Kadrlar Bo‘limi Mutaxassisi",
		Company:     "Ishonch Do‘konlar Tarmog‘i",
		Location:    "Buxoro viloyati",
		Category:    "HR & Menejment",
		JobType:     "Full-time",
		Experience:  "1-3 yil",
		Salary:      "10 000 000 - 16 000 000 UZS",
		Tags:        "Kadrlar ishi, Mehnat kodeksi, Rekruting, Onboarding, Suhbatlar",
		Description: "Yangi xodimlarni saralash va suhbatlar o‘tkazish, mehnat daftarchalari va 1C tizimida xodimlar hisobini yuritish.",
	},
}

// StartLiveVacancyWorker starts a background worker that regularly generates fresh, realistic vacancies.
func StartLiveVacancyWorker(db *sql.DB, rdb *redis.Client) {
	if db == nil {
		return
	}

	if os.Getenv("ENABLE_LIVE_VACANCIES") == "false" {
		log.Println("[Live Job Worker] disabled by ENABLE_LIVE_VACANCIES=false")
		return
	}

	interval := 10 * time.Minute
	if raw := os.Getenv("LIVE_JOB_INTERVAL"); raw != "" {
		if d, err := time.ParseDuration(raw); err == nil && d >= 30*time.Second {
			interval = d
		}
	}

	go func() {
		// 1. Initial check: ensure we have fresh vacancies from today
		time.Sleep(3 * time.Second)
		ensureRecentVacancies(db, rdb)

		// 2. Periodic loop
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			insertRandomVacancy(db, rdb, time.Now().UTC())
		}
	}()

	log.Printf("[Live Job Worker] started, publishing fresh Uzbekistan vacancies every %s", interval)
}

func ensureRecentVacancies(db *sql.DB, rdb *redis.Client) {
	var count int
	err := db.QueryRow(`SELECT COUNT(*) FROM vacancies WHERE created_at >= NOW() - INTERVAL '24 hours'`).Scan(&count)
	if err != nil {
		log.Printf("[Live Job Worker] check error: %v", err)
		return
	}

	if count < 6 {
		needed := 6 - count
		log.Printf("[Live Job Worker] Only %d vacancies created in the last 24h. Publishing %d fresh jobs...", count, needed)

		now := time.Now().UTC()
		for i := 0; i < needed; i++ {
			// Space them slightly in the past few hours
			t := now.Add(-time.Duration(i*35) * time.Minute)
			insertRandomVacancy(db, rdb, t)
		}
	}
}

func insertRandomVacancy(db *sql.DB, rdb *redis.Client, createdAt time.Time) {
	rand.Seed(time.Now().UnixNano())
	template := liveUzbekistanJobs[rand.Intn(len(liveUzbekistanJobs))]

	newID := uuid.NewString()
	query := `
		INSERT INTO vacancies (
			id, title, company, location, description, salary, category,
			job_type, experience, tags, company_logo, is_verified, is_featured,
			views_count, source, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7,
			$8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17
		)`

	_, err := db.Exec(
		query,
		newID,
		template.Title,
		template.Company,
		template.Location,
		template.Description,
		template.Salary,
		template.Category,
		template.JobType,
		template.Experience,
		template.Tags,
		"",
		true,
		false,
		rand.Intn(40)+5,
		"WZone",
		createdAt,
		createdAt,
	)
	if err != nil {
		log.Printf("[Live Job Worker] Error inserting vacancy: %v", err)
		return
	}

	log.Printf("[Live Job Worker] Published fresh vacancy: «%s» at %s (%s)", template.Title, template.Company, template.Location)

	// Invalidate redis cache so API clients immediately receive the updated list
	if rdb != nil {
		ctx := context.Background()
		iter := rdb.Scan(ctx, 0, "vacancies:*", 0).Iterator()
		for iter.Next(ctx) {
			_ = rdb.Del(ctx, iter.Val()).Err()
		}
	}
}
