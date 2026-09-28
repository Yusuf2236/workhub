package storage

import "fmt"

type MinIOStorage struct {
    Endpoint  string
    AccessKey string
    SecretKey string
    Bucket    string
    UseSSL    bool
}

func (s *MinIOStorage) Upload(key, contentType string) (string, error) {
    if s.Bucket == "" || key == "" {
        return "", fmt.Errorf("bucket and key are required")
    }
    return fmt.Sprintf("%s/%s", s.Bucket, key), nil
}

func (s *MinIOStorage) URLFor(key string) string {
    scheme := "http"
    if s.UseSSL {
        scheme = "https"
    }
    return fmt.Sprintf("%s://%s/%s/%s", scheme, s.Endpoint, s.Bucket, key)
}
