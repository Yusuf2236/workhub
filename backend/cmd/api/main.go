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
    "github.com/Yusuf2236/workhub/backend/internal/handlers"
    "github.com/Yusuf2236/workhub/backend/internal/middleware"
)

func main() {
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("load config: %v", err)
    }

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

    api := r.Group("/api/v1")
    {
        api.POST("/auth/register", handlers.Register)
        api.POST("/auth/login", handlers.Login)
        api.GET("/auth/me", middleware.AuthRequired(), handlers.Me)

        api.GET("/vacancies", handlers.ListVacancies)
        api.POST("/vacancies", middleware.AuthRequired(), handlers.CreateVacancy)
        api.GET("/vacancies/:id", handlers.GetVacancy)
        api.POST("/vacancies/:id/apply", middleware.AuthRequired(), handlers.ApplyToVacancy)

        api.GET("/applications", middleware.AuthRequired(), handlers.ListApplications)
        api.PATCH("/applications/:id/status", middleware.AuthRequired(), handlers.UpdateApplicationStatus)

        api.GET("/resumes", middleware.AuthRequired(), handlers.ListResumes)
        api.POST("/resumes", middleware.AuthRequired(), handlers.CreateResume)

        api.GET("/chat/health", handlers.ChatHealth)
        api.GET("/ws", handlers.HandleChatSocket)

        api.GET("/admin/users", middleware.AuthRequired(), handlers.ListUsers)
        api.GET("/admin/analytics", middleware.AuthRequired(), handlers.AdminAnalytics)
    }
}
