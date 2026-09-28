package hash

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestHashPassword(t *testing.T) {
	password := "SecretPassword123!"

	hashed, err := HashPassword(password)
	if err != nil {
		t.Fatalf("expected no error hashing password, got %v", err)
	}

	if hashed == password {
		t.Fatal("hashed password must not match plain text")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password)); err != nil {
		t.Fatalf("bcrypt verification failed: %v", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte("WrongPassword")); err == nil {
		t.Fatal("expected error for wrong password, got nil")
	}
}
