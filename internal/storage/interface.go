package storage

type Storage interface {
    Upload(key, contentType string) (string, error)
    URLFor(key string) string
}
