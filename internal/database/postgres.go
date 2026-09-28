package database

import (
    "database/sql"
    "fmt"
    "strings"
    "time"

    _ "github.com/lib/pq"
)

type PostgresConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    SSLMode  string
}

func NewPostgresConfig(host string, port int, user, password, dbName, sslMode string) PostgresConfig {
    return PostgresConfig{
        Host:     host,
        Port:     port,
        User:     user,
        Password: password,
        DBName:   dbName,
        SSLMode:  sslMode,
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

func NewPostgresDB(cfg PostgresConfig) (*sql.DB, error) {
    db, err := sql.Open("postgres", cfg.DSN())
    if err != nil {
        return nil, fmt.Errorf("open postgres connection: %w", err)
    }

    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(5 * time.Minute)

    if err := db.Ping(); err != nil {
        return nil, fmt.Errorf("ping postgres: %w", err)
    }

    return db, nil
}
