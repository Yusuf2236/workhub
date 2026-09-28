package crypto

import (
	"strings"
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	original := "31201991234567" // Sample 14-digit citizen PINFL

	encrypted, err := Encrypt(original)
	if err != nil {
		t.Fatalf("encryption failed: %v", err)
	}

	if !strings.HasPrefix(encrypted, "enc:v1:") {
		t.Fatalf("expected enc:v1: prefix, got: %s", encrypted)
	}

	if strings.Contains(encrypted, original) {
		t.Fatalf("ciphertext must not contain original plaintext!")
	}

	// Test nonces differ for identical plaintext
	encrypted2, _ := Encrypt(original)
	if encrypted == encrypted2 {
		t.Fatalf("AES-GCM must generate different ciphertexts with random nonces")
	}

	// Decrypt both
	decrypted, err := Decrypt(encrypted)
	if err != nil {
		t.Fatalf("decryption failed: %v", err)
	}
	if decrypted != original {
		t.Fatalf("expected %s, got %s", original, decrypted)
	}

	decrypted2, err := Decrypt(encrypted2)
	if err != nil {
		t.Fatalf("decryption 2 failed: %v", err)
	}
	if decrypted2 != original {
		t.Fatalf("expected %s, got %s", original, decrypted2)
	}
}

func TestTamperingDetection(t *testing.T) {
	original := "secret_citizen_data"
	encrypted, _ := Encrypt(original)

	// Tamper with one character of ciphertext
	tampered := encrypted[:len(encrypted)-2] + "ff"
	_, err := Decrypt(tampered)
	if err == nil {
		t.Fatalf("decryption of tampered ciphertext should have failed with authentication error!")
	}
}

func TestBlindIndex(t *testing.T) {
	pinfl1 := "31201991234567"
	pinfl2 := "31201991234568"

	idx1 := BlindIndex(pinfl1)
	idx1Again := BlindIndex(pinfl1)
	idx2 := BlindIndex(pinfl2)

	if idx1 != idx1Again {
		t.Fatalf("blind index must be deterministic")
	}
	if idx1 == idx2 {
		t.Fatalf("different PINFLs must yield different blind indices")
	}
	if strings.Contains(idx1, pinfl1) {
		t.Fatalf("blind index must not leak plaintext PINFL")
	}
}
