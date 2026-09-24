package services

import "fmt"

type StorageService struct {
    Bucket string
}

func NewStorageService(bucket string) *StorageService {
    return &StorageService{Bucket: bucket}
}

func (s *StorageService) Upload(key, contentType string) (string, error) {
    if s.Bucket == "" || key == "" {
        return "", fmt.Errorf("bucket and key are required")
    }
    return fmt.Sprintf("%s/%s", s.Bucket, key), nil
}
