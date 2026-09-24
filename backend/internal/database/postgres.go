package database

import (
    "fmt"
    "strings"
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
