package storage

import "fmt"

type R2Storage struct {
    Bucket    string
    PublicURL string
}

func (s *R2Storage) Upload(key, contentType string) (string, error) {
    if s.Bucket == "" || key == "" {
        return "", fmt.Errorf("bucket and key are required")
    }
    return fmt.Sprintf("%s/%s", s.Bucket, key), nil
}

func (s *R2Storage) URLFor(key string) string {
    if s.PublicURL == "" {
        return key
    }
    return fmt.Sprintf("%s/%s", s.PublicURL, key)
}
