package middleware

import "testing"

func TestIsOriginAllowed(t *testing.T) {
	allowed := []string{
		"http://localhost:3000",
		"http://127.0.0.1:3005",
		"https://wzone.uz",
		"https://app.wzone.uz",
		"https://admin.wzone.uz",
		"https://api.wzone.uz",
		"https://staging.wzone.uz",
		"https://workhub.uz",
	}

	for _, o := range allowed {
		if !IsOriginAllowed(o) {
			t.Errorf("expected origin %q to be allowed, but was rejected", o)
		}
	}

	disallowed := []string{
		"http://evil.com",
		"https://evil.com",
		"https://fake-wzone.uz",
		"http://wzone.uz", // non-https
		"",
	}

	for _, o := range disallowed {
		if IsOriginAllowed(o) {
			t.Errorf("expected origin %q to be disallowed, but was accepted", o)
		}
	}
}
