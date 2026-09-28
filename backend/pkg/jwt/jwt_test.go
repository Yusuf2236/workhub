package jwt

import (
	"testing"
)

func TestGenerateAndParseToken(t *testing.T) {
	userID := "test-user-123"
	email := "test@workhub.uz"

	token, err := GenerateToken(userID, email)
	if err != nil {
		t.Fatalf("expected no error generating token, got %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token string")
	}

	claims, err := ParseToken(token)
	if err != nil {
		t.Fatalf("expected no error parsing valid token, got %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %s, got %s", userID, claims.UserID)
	}
	if claims.Email != email {
		t.Errorf("expected Email %s, got %s", email, claims.Email)
	}
}

func TestParseInvalidToken(t *testing.T) {
	_, err := ParseToken("invalid.jwt.token")
	if err == nil {
		t.Fatal("expected error parsing invalid token, got nil")
	}
}
