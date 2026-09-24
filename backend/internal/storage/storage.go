package storage

import (
    "fmt"
    "net/url"
    "path"

    "github.com/Yusuf2236/workhub/backend/internal/config"
)

type Provider string

const (
    ProviderMinIO        Provider = "minio"
    ProviderCloudflareR2 Provider = "cloudflare-r2"
)

type Config struct {
    Provider  Provider
    Endpoint  string
    Bucket    string
    AccessKey string
    SecretKey string
    UseSSL    bool
    PublicURL string
}

type Service struct {
    cfg Config
}

func New(cfg *config.Config) *Service {
    if cfg == nil {
        return &Service{cfg: Config{Provider: ProviderMinIO}}
    }

    provider := Provider(cfg.Storage.Provider)
    return &Service{cfg: Config{
        Provider:  provider,
        Endpoint:  cfg.Storage.Endpoint,
        Bucket:    cfg.Storage.Bucket,
        AccessKey: cfg.Storage.AccessKey,
        SecretKey: cfg.Storage.SecretKey,
        UseSSL:    cfg.Storage.UseSSL,
        PublicURL: cfg.Storage.PublicURL,
    }}
}

func (s *Service) Validate() error {
    if s == nil {
        return fmt.Errorf("storage service is nil")
    }
    if s.cfg.Bucket == "" {
        return fmt.Errorf("storage bucket is required")
    }
    if s.cfg.AccessKey == "" || s.cfg.SecretKey == "" {
        return fmt.Errorf("storage access key and secret key are required")
    }
    return nil
}

func (s *Service) PublicURLFor(key string) string {
    if s == nil || s.cfg.PublicURL == "" {
        return key
    }

    u, err := url.Parse(s.cfg.PublicURL)
    if err != nil {
        return path.Join(s.cfg.PublicURL, key)
    }

    u.Path = path.Join(u.Path, key)
    return u.String()
}
