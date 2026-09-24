package database

import (
    "fmt"
    "strings"

    "github.com/Yusuf2236/workhub/backend/internal/config"
)

type PostgresConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    SSLMode  string
}

func NewPostgresConfig(cfg *config.Config) PostgresConfig {
    return PostgresConfig{
        Host:     cfg.Database.Host,
        Port:     cfg.Database.Port,
        User:     cfg.Database.User,
        Password: cfg.Database.Password,
        DBName:   cfg.Database.Name,
        SSLMode:  cfg.Database.SSLMode,
    }
}

func (c PostgresConfig) DSN() string {
    if c.Host == "" {
        c.Host = "localhost"
    }
    if c.Port == 0 {
        c.Port = 5432
    }
    if c.SSLMode == "" {
        c.SSLMode = "disable"
    }

    parts := []string{
        fmt.Sprintf("host=%s", c.Host),
        fmt.Sprintf("port=%d", c.Port),
        fmt.Sprintf("user=%s", c.User),
        fmt.Sprintf("password=%s", c.Password),
        fmt.Sprintf("dbname=%s", c.DBName),
        fmt.Sprintf("sslmode=%s", c.SSLMode),
    }

    return strings.Join(parts, " ")
}

func Validate(cfg *config.Config) error {
    if cfg == nil {
        return fmt.Errorf("config is nil")
    }
    if cfg.Database.Host == "" || cfg.Database.User == "" || cfg.Database.Name == "" {
        return fmt.Errorf("database host, user, and name are required")
    }
    return nil
}
