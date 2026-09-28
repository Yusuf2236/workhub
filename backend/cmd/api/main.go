package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/Yusuf2236/workhub/backend/internal/config"
    "github.com/Yusuf2236/workhub/backend/internal/database"
    "github.com/Yusuf2236/workhub/backend/internal/handlers"
    "github.com/Yusuf2236/workhub/backend/internal/middleware"
    "github.com/Yusuf2236/workhub/backend/internal/services"
)

func main() {
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("load config: %v", err)
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
    handlers.Init(db, rdb)

    // Initialize background services
    services.InitTelegramService()
    services.StartBackgroundAggregator(24 * time.Hour)

    if cfg.Server.Env == "production" {
        gin.SetMode(gin.ReleaseMode)
    }

    router := gin.Default()
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

func setupMiddlewares(r *gin.Engine) {
    r.Use(middleware.Logger())
    r.Use(middleware.CORSMiddleware())
    r.Use(middleware.Recovery())
}

func setupRoutes(r *gin.Engine) {
    r.GET("/health", handlers.Health)
    r.Static("/uploads", "./uploads")

    api := r.Group("/api/v1")
    {
        api.POST("/auth/register", handlers.Register)
        api.POST("/auth/login", handlers.Login)
        api.POST("/auth/google", handlers.GoogleAuth)
        api.GET("/auth/oneid/login", handlers.OneIDLogin)
        api.POST("/auth/oneid/callback", handlers.OneIDCallback)
        api.GET("/auth/oneid/qr/generate", handlers.OneIDQRGenerate)
        api.POST("/auth/oneid/qr/check", handlers.OneIDQRCheck)
        api.GET("/auth/me", middleware.AuthRequired(), handlers.Me)
        api.GET("/profile", middleware.AuthRequired(), handlers.GetProfile)
        api.PUT("/profile", middleware.AuthRequired(), handlers.UpdateProfile)
        api.POST("/profile/avatar", middleware.AuthRequired(), handlers.UploadAvatar)

        api.GET("/vacancies", handlers.ListVacancies)
        api.GET("/vacancies/recommendations", middleware.AuthRequired(), handlers.GetRecommendations)
        api.POST("/vacancies", middleware.OptionalAuth(), handlers.CreateVacancy)
        api.GET("/vacancies/:id", handlers.GetVacancy)
        api.POST("/vacancies/:id/apply", middleware.AuthRequired(), handlers.ApplyToVacancy)
        api.GET("/vacancies/:id/comments", handlers.ListVacancyComments)
        api.POST("/vacancies/:id/comments", middleware.OptionalAuth(), handlers.CreateVacancyComment)

        api.GET("/applications", middleware.AuthRequired(), handlers.ListApplications)
        api.PATCH("/applications/:id/status", middleware.AuthRequired(), handlers.UpdateApplicationStatus)

        api.GET("/resumes", middleware.OptionalAuth(), handlers.ListResumes)
        api.POST("/resumes", middleware.AuthRequired(), handlers.CreateResume)
        api.POST("/resumes/upload", middleware.AuthRequired(), handlers.UploadResumeFile)

        api.GET("/notifications", middleware.AuthRequired(), handlers.ListNotifications)
        api.PATCH("/notifications/:id/read", middleware.AuthRequired(), handlers.MarkNotificationRead)

        api.GET("/billing/plans", handlers.GetPlans)
        api.POST("/billing/subscribe", middleware.AuthRequired(), handlers.Subscribe)
        api.GET("/billing/my-subscription", middleware.AuthRequired(), handlers.GetMySubscription)
        api.POST("/billing/webhook", handlers.HandlePaymentWebhook)
        api.POST("/billing/click", handlers.ClickWebhook)
        api.POST("/billing/payme", handlers.PaymeWebhook)

        api.GET("/chat/health", handlers.ChatHealth)
        api.GET("/chat/rooms", handlers.ListChatRooms)
        api.GET("/chat/messages", handlers.ListChatMessages)
        api.POST("/chat/messages", middleware.OptionalAuth(), handlers.SendChatMessage)
        api.GET("/ws", handlers.HandleChatSocket)

        api.GET("/admin/users", middleware.AuthRequired(), handlers.ListUsers)
        api.GET("/admin/analytics", middleware.AuthRequired(), handlers.AdminAnalytics)
    }
}
