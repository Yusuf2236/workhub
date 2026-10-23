package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/config"
	"github.com/Yusuf2236/workhub/backend/internal/database"
	"github.com/Yusuf2236/workhub/backend/internal/handlers"
	"github.com/Yusuf2236/workhub/backend/internal/middleware"
	"github.com/Yusuf2236/workhub/backend/internal/services"
	"github.com/Yusuf2236/workhub/backend/pkg/crypto"
	"github.com/Yusuf2236/workhub/backend/pkg/jwt"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	jwt.SetSecret(cfg.JWT.Secret)
	jwt.SetTTL(cfg.JWT.TTL)
	encKey := os.Getenv("ONEID_ENCRYPTION_KEY")
	if encKey == "" {
		encKey = os.Getenv("DATA_ENCRYPTION_KEY")
	}
	if encKey == "" {
		encKey = cfg.JWT.Secret
	}
	crypto.SetMasterKey(encKey)
	if cfg.IsProduction() && os.Getenv("ONEID_ENCRYPTION_KEY") == "" && os.Getenv("DATA_ENCRYPTION_KEY") == "" {
		log.Println("[Security] warning: ONEID_ENCRYPTION_KEY is not set; PINFL encryption key is derived from JWT_SECRET")
	}

	// Connect to PostgreSQL
	pgCfg := database.NewPostgresConfig(
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)
	db, err := database.NewPostgresDB(pgCfg)
	if err != nil {
		log.Printf("[DB] warning: postgres connection failed: %v", err)
	} else {
		defer db.Close()
		log.Println("[DB] PostgreSQL connected successfully")
		if err := database.AutoMigrate(db); err != nil {
			log.Printf("[DB] migration warning: %v", err)
		} else if err := database.RunOnce(db, "go_recategorize_legacy_vacancies_v1", services.RecategorizeLegacyVacancies); err != nil {
			log.Printf("[DB] migration warning: %v", err)
		} else if err := database.RunOnce(db, "go_fix_legacy_vacancy_tags_v1", services.FixLegacyVacancyTags); err != nil {
			log.Printf("[DB] migration warning: %v", err)
		}
	}

	// Connect to Redis
	rdb, err := database.NewRedisClient(database.RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		URL:      cfg.Redis.URL,
	})
	if err != nil {
		log.Printf("[Redis] warning: redis connection failed: %v", err)
	} else {
		defer rdb.Close()
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := rdb.Ping(ctx).Err(); err != nil {
			log.Printf("[Redis] warning: redis ping failed: %v", err)
		} else {
			log.Println("[Redis] Redis connected and pinged successfully")
		}
		cancel()
	}

	// Initialize handlers with database and redis
	handlers.Init(db, rdb, cfg.IsProduction())
	middleware.SetTokenValidator(handlers.TokenValidator())

	// Initialize background services
	services.InitTelegramService()
	if aggCfg, ok := services.AggregatorConfigFromEnv(); !ok {
		log.Println("[Aggregator] disabled (set HH_APP_TOKEN or HH_CLIENT_ID/HH_CLIENT_SECRET to import hh.uz vacancies)")
	} else if os.Getenv("ENABLE_SCRAPER") == "false" {
		log.Println("[Aggregator] disabled by ENABLE_SCRAPER=false")
	} else {
		services.StartBackgroundAggregator(db, rdb, aggCfg)
	}
	services.StartLiveVacancyWorker(db, rdb)

	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()
	// Only proxies on the local/private network (nginx, docker) may set X-Forwarded-For,
	// otherwise clients could spoof their IP and bypass rate limits.
	if err := router.SetTrustedProxies(trustedProxies()); err != nil {
		log.Fatalf("trusted proxies: %v", err)
	}
	setupMiddlewares(router)
	setupRoutes(router)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  30 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen and serve: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutdown signal received")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server shutdown: %v", err)
	}

	log.Println("server exited cleanly")
}

func trustedProxies() []string {
	if env := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES")); env != "" {
		var out []string
		for _, p := range strings.Split(env, ",") {
			if p = strings.TrimSpace(p); p != "" {
				out = append(out, p)
			}
		}
		return out
	}
	return []string{"127.0.0.1", "::1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"}
}

func setupMiddlewares(r *gin.Engine) {
	r.Use(middleware.Logger())
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.Recovery())
}

func setupRoutes(r *gin.Engine) {
	r.GET("/health", handlers.Health)

	uploads := r.Group("/uploads")
	uploads.Use(func(c *gin.Context) {
		// Prevent uploaded files from being rendered as HTML/script by the browser
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox")
		if strings.HasPrefix(c.Request.URL.Path, "/uploads/resumes") {
			c.Header("Content-Disposition", "attachment")
		}
		c.Next()
	})
	uploads.Static("/", "./uploads")

	// Per-IP limits against password guessing and spam
	authLimit := middleware.RateLimit(20, time.Minute)
	qrLimit := middleware.RateLimit(120, time.Minute)
	writeLimit := middleware.RateLimit(30, time.Minute)
	chatLimit := middleware.RateLimit(60, time.Minute)

	api := r.Group("/api/v1")
	{
		api.POST("/auth/register", authLimit, handlers.Register)
		api.POST("/auth/login", authLimit, handlers.Login)
		api.POST("/auth/google", authLimit, handlers.GoogleAuth)
		api.GET("/auth/oneid/login", handlers.OneIDLogin)
		api.POST("/auth/oneid/callback", authLimit, handlers.OneIDCallback)
		api.GET("/auth/oneid/qr/generate", qrLimit, handlers.OneIDQRGenerate)
		api.POST("/auth/oneid/qr/check", qrLimit, handlers.OneIDQRCheck)
		api.POST("/auth/oneid/select-identity", middleware.AuthRequired(), handlers.SelectOneIDIdentity)
		api.GET("/auth/oneid/organizations", middleware.AuthRequired(), handlers.GetOneIDOrganizations)
		api.GET("/auth/me", middleware.AuthRequired(), handlers.Me)
		api.POST("/auth/logout", middleware.AuthRequired(), handlers.Logout)
		api.POST("/auth/password/forgot", authLimit, handlers.ForgotPassword)
		api.POST("/auth/password/reset", authLimit, handlers.ResetPassword)
		api.POST("/auth/email/verify", authLimit, handlers.VerifyEmail)
		api.POST("/auth/email/resend", authLimit, middleware.AuthRequired(), handlers.ResendVerification)
		api.GET("/profile", middleware.AuthRequired(), handlers.GetProfile)
		api.PUT("/profile", middleware.AuthRequired(), handlers.UpdateProfile)
		api.POST("/profile/avatar", middleware.AuthRequired(), handlers.UploadAvatar)

		api.GET("/vacancies", handlers.ListVacancies)
		api.GET("/vacancies/recommendations", middleware.AuthRequired(), handlers.GetRecommendations)
		api.GET("/vacancies/mine", middleware.AuthRequired(), handlers.ListMyVacancies)
		api.GET("/vacancies/sitemap", handlers.VacancySitemap)
		api.POST("/vacancies", writeLimit, middleware.AuthRequired(), handlers.CreateVacancy)
		api.GET("/vacancies/:id", handlers.GetVacancy)
		api.PUT("/vacancies/:id", middleware.AuthRequired(), handlers.UpdateVacancy)
		api.DELETE("/vacancies/:id", middleware.AuthRequired(), handlers.DeleteVacancy)
		api.POST("/vacancies/:id/apply", writeLimit, middleware.AuthRequired(), handlers.ApplyToVacancy)
		api.GET("/comments/recent", handlers.ListRecentComments)
		api.GET("/vacancies/:id/comments", handlers.ListVacancyComments)
		api.POST("/vacancies/:id/comments", writeLimit, middleware.OptionalAuth(), handlers.CreateVacancyComment)

		api.GET("/applications", middleware.AuthRequired(), handlers.ListApplications)
		api.GET("/applications/received", middleware.AuthRequired(), handlers.ListReceivedApplications)
		api.PATCH("/applications/:id/status", middleware.AuthRequired(), handlers.UpdateApplicationStatus)

		api.GET("/resumes", middleware.AuthRequired(), handlers.ListResumes)
		api.POST("/resumes", middleware.AuthRequired(), handlers.CreateResume)
		api.POST("/resumes/upload", middleware.AuthRequired(), handlers.UploadResumeFile)
		api.GET("/resumes/:id", middleware.AuthRequired(), handlers.GetResume)
		api.PUT("/resumes/:id", middleware.AuthRequired(), handlers.UpdateResume)
		api.DELETE("/resumes/:id", middleware.AuthRequired(), handlers.DeleteResume)

		api.GET("/notifications", middleware.AuthRequired(), handlers.ListNotifications)
		api.PATCH("/notifications/:id/read", middleware.AuthRequired(), handlers.MarkNotificationRead)

		api.GET("/billing/plans", handlers.GetPlans)
		api.POST("/billing/subscribe", middleware.AuthRequired(), handlers.Subscribe)
		api.GET("/billing/my-subscription", middleware.AuthRequired(), handlers.GetMySubscription)
		api.POST("/billing/webhook", handlers.HandlePaymentWebhook)
		api.POST("/billing/click", handlers.ClickWebhook)
		api.POST("/billing/payme", handlers.PaymeWebhook)

		api.GET("/chat/health", handlers.ChatHealth)
		api.GET("/chat/rooms", middleware.OptionalAuth(), handlers.ListChatRooms)
		api.GET("/chat/messages", middleware.OptionalAuth(), handlers.ListChatMessages)
		api.POST("/chat/messages", chatLimit, middleware.OptionalAuth(), handlers.SendChatMessage)
		api.GET("/ws", handlers.HandleChatSocket)

		api.GET("/admin/users", middleware.AdminRequired(), handlers.ListUsers)
		api.GET("/admin/analytics", middleware.AdminRequired(), handlers.AdminAnalytics)
	}
}
