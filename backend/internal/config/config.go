package config

import (
    "fmt"
    "strings"
    "time"

    "github.com/spf13/viper"
)

type Config struct {
    Server struct {
        Port int
        Env  string
    }
    JWT struct {
        Secret     string
        AccessTTL  time.Duration
        RefreshTTL time.Duration
    }
    Database struct {
        Host     string
        Port     int
        User     string
        Password string
        Name     string
        SSLMode  string
        URL      string
    }
    Redis struct {
        Host     string
        Port     int
        Password string
        URL      string
    }
    Storage struct {
        Provider  string
        Endpoint  string
        Bucket    string
        AccessKey string
        SecretKey string
        UseSSL    bool
        PublicURL string
    }
    Firebase struct {
        ProjectID   string
        ClientEmail string
        PrivateKey  string
        WebAPIKey   string
    }
    CORS struct {
        AllowedOrigins []string
    }
}

func Load() (*Config, error) {
    v := viper.New()
    v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
    v.AutomaticEnv()

    v.SetDefault("PORT", 8080)
    v.SetDefault("APP_ENV", "development")
    v.SetDefault("JWT_SECRET", "dev-secret")
    v.SetDefault("JWT_ACCESS_TTL", "15m")
    v.SetDefault("JWT_REFRESH_TTL", "168h")

    v.SetDefault("DB_HOST", "localhost")
    v.SetDefault("DB_PORT", 5432)
    v.SetDefault("DB_USER", "postgres")
    v.SetDefault("DB_PASSWORD", "postgres")
    v.SetDefault("DB_NAME", "workhub")
    v.SetDefault("DB_SSLMODE", "disable")
    v.SetDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/workhub?sslmode=disable")

    v.SetDefault("REDIS_HOST", "localhost")
    v.SetDefault("REDIS_PORT", 6379)
    v.SetDefault("REDIS_PASSWORD", "")
    v.SetDefault("REDIS_URL", "redis://localhost:6379")

    v.SetDefault("STORAGE_PROVIDER", "minio")
    v.SetDefault("STORAGE_ENDPOINT", "localhost:9000")
    v.SetDefault("STORAGE_BUCKET", "workhub")
    v.SetDefault("STORAGE_ACCESS_KEY", "minioadmin")
    v.SetDefault("STORAGE_SECRET_KEY", "minioadmin")
    v.SetDefault("STORAGE_USE_SSL", false)
    v.SetDefault("STORAGE_PUBLIC_URL", "http://localhost:9000/workhub")

    v.SetDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8080,android://localhost,ios://localhost")

    cfg := &Config{}
    cfg.Server.Port = v.GetInt("PORT")
    cfg.Server.Env = v.GetString("APP_ENV")

    cfg.JWT.Secret = v.GetString("JWT_SECRET")
    accessTTL, err := time.ParseDuration(v.GetString("JWT_ACCESS_TTL"))
    if err == nil {
        cfg.JWT.AccessTTL = accessTTL
    } else {
        cfg.JWT.AccessTTL = 15 * time.Minute
    }
    refreshTTL, err := time.ParseDuration(v.GetString("JWT_REFRESH_TTL"))
    if err == nil {
        cfg.JWT.RefreshTTL = refreshTTL
    } else {
        cfg.JWT.RefreshTTL = 168 * time.Hour
    }

    cfg.Database.Host = v.GetString("DB_HOST")
    cfg.Database.Port = v.GetInt("DB_PORT")
    cfg.Database.User = v.GetString("DB_USER")
    cfg.Database.Password = v.GetString("DB_PASSWORD")
    cfg.Database.Name = v.GetString("DB_NAME")
    cfg.Database.SSLMode = v.GetString("DB_SSLMODE")
    cfg.Database.URL = v.GetString("DATABASE_URL")

    cfg.Redis.Host = v.GetString("REDIS_HOST")
    cfg.Redis.Port = v.GetInt("REDIS_PORT")
    cfg.Redis.Password = v.GetString("REDIS_PASSWORD")
    cfg.Redis.URL = v.GetString("REDIS_URL")

    cfg.Storage.Provider = v.GetString("STORAGE_PROVIDER")
    cfg.Storage.Endpoint = v.GetString("STORAGE_ENDPOINT")
    cfg.Storage.Bucket = v.GetString("STORAGE_BUCKET")
    cfg.Storage.AccessKey = v.GetString("STORAGE_ACCESS_KEY")
    cfg.Storage.SecretKey = v.GetString("STORAGE_SECRET_KEY")
    cfg.Storage.UseSSL = v.GetBool("STORAGE_USE_SSL")
    cfg.Storage.PublicURL = v.GetString("STORAGE_PUBLIC_URL")

    cfg.Firebase.ProjectID = v.GetString("FIREBASE_PROJECT_ID")
    cfg.Firebase.ClientEmail = v.GetString("FIREBASE_CLIENT_EMAIL")
    cfg.Firebase.PrivateKey = v.GetString("FIREBASE_PRIVATE_KEY")
    cfg.Firebase.WebAPIKey = v.GetString("FIREBASE_WEB_API_KEY")

    cfg.CORS.AllowedOrigins = strings.Split(v.GetString("CORS_ALLOWED_ORIGINS"), ",")

    if cfg.JWT.Secret == "" {
        return nil, fmt.Errorf("JWT_SECRET is required")
    }
    return cfg, nil
}
