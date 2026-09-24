package database

import (
    "fmt"
    "github.com/go-redis/redis/v8"
)
)

type RedisConfig struct {
    Host     string
    Port     int
    Password string
    DB       int
    URL      string
}

func NewRedisClient(cfg RedisConfig) (*redis.Client, error) {
    if cfg.URL != "" {
        opts, err := redis.ParseURL(cfg.URL)
        if err != nil {
            return nil, fmt.Errorf("parse redis url: %w", err)
        }
        return redis.NewClient(opts), nil
    }

    if cfg.Host == "" {
        cfg.Host = "localhost"
    }
    if cfg.Port == 0 {
        cfg.Port = 6379
    }

    client := redis.NewClient(&redis.Options{
        Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
        Password: cfg.Password,
        DB:       cfg.DB,
    })

    return client, nil
}
