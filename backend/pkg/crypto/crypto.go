package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"

	"golang.org/x/crypto/pbkdf2"
)

const (
	cipherPrefix = "enc:v1:"
	salt         = "workhub_oneid_sovereign_security_salt_2026"
	iterations   = 100000
)

var (
	once      sync.Once
	aesKey    []byte
	hmacKey   []byte
	keyErr    error
)

// initKeys initializes the 256-bit AES encryption key and HMAC blind index key
func initKeys() {
	masterKey := os.Getenv("ONEID_ENCRYPTION_KEY")
	if masterKey == "" {
		masterKey = os.Getenv("DATA_ENCRYPTION_KEY")
	}
	if masterKey == "" {
		masterKey = os.Getenv("JWT_SECRET")
	}
	if masterKey == "" {
		masterKey = "workhub_super_secret_master_encryption_key_never_leak_2026"
	}

	// Derive 256-bit key for AES-GCM
	aesKey = pbkdf2.Key([]byte(masterKey), []byte(salt+":aes"), iterations, 32, sha256.New)

	// Derive 256-bit key for HMAC Blind Index
	hmacKey = pbkdf2.Key([]byte(masterKey), []byte(salt+":hmac"), iterations, 32, sha256.New)
}

func ensureInitialized() {
	once.Do(initKeys)
}

// Encrypt encrypts sensitive plaintext (such as PINFL, citizen identity) using AES-256-GCM
// Each encryption uses a fresh cryptographically random 12-byte nonce.
func Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}
	if strings.HasPrefix(plaintext, cipherPrefix) {
		return plaintext, nil
	}

	ensureInitialized()

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", fmt.Errorf("aes cipher error: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("gcm cipher error: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("nonce generation failed: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(plaintext), nil)
	return fmt.Sprintf("%s%s:%s", cipherPrefix, hex.EncodeToString(nonce), hex.EncodeToString(ciphertext)), nil
}

// Decrypt decrypts an AES-256-GCM ciphertext. If data is not encrypted, returns as-is.
func Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}
	if !strings.HasPrefix(ciphertext, cipherPrefix) {
		// Plaintext fallback for backward compatibility
		return ciphertext, nil
	}

	ensureInitialized()

	raw := strings.TrimPrefix(ciphertext, cipherPrefix)
	parts := strings.Split(raw, ":")
	if len(parts) != 2 {
		return "", errors.New("invalid encrypted payload format")
	}

	nonce, err := hex.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("decode nonce error: %w", err)
	}

	sealed, err := hex.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("decode ciphertext error: %w", err)
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return "", fmt.Errorf("aes cipher error: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("gcm cipher error: %w", err)
	}

	plaintext, err := gcm.Open(nil, nonce, sealed, nil)
	if err != nil {
		return "", errors.New("decryption failed: authentication tag verification failed (tampered data or wrong key)")
	}

	return string(plaintext), nil
}

// BlindIndex creates a deterministic cryptographic HMAC-SHA256 hash of a value (e.g. PINFL)
// This allows exact-match lookups in PostgreSQL without ever exposing the real PINFL in plaintext!
func BlindIndex(value string) string {
	if value == "" {
		return ""
	}
	ensureInitialized()

	mac := hmac.New(sha256.New, hmacKey)
	mac.Write([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(mac.Sum(nil))
}

// AnonymizeFilename creates an irreversible cryptographic hash for avatar/passport images
// to ensure the filename never reveals citizen PINFL or identity.
func AnonymizeFilename(pinfl string) string {
	h := sha256.New()
	h.Write([]byte(pinfl + ":" + salt))
	return hex.EncodeToString(h.Sum(nil))[:20]
}
