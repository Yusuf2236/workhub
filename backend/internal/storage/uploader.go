package storage

import "fmt"

type Uploader struct {
    provider Storage
}

func NewUploader(provider Storage) *Uploader {
    return &Uploader{provider: provider}
}

func (u *Uploader) Upload(key, contentType string) (string, error) {
    if u == nil || u.provider == nil {
        return "", fmt.Errorf("uploader provider is nil")
    }
    return u.provider.Upload(key, contentType)
}
