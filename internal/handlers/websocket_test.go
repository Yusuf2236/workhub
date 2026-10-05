package handlers

import (
	"net/http/httptest"
	"testing"
)

func TestIsSameSiteOrigin(t *testing.T) {
	cases := []struct {
		host, origin string
		want         bool
	}{
		{"wzone.uz", "https://wzone.uz", true},
		{"203.0.113.5:8080", "http://203.0.113.5:3000", true},
		{"wzone.uz", "https://evil.example", false},
		{"wzone.uz", "not a url", false},
	}
	for _, c := range cases {
		r := httptest.NewRequest("GET", "/api/v1/ws", nil)
		r.Host = c.host
		if got := isSameSiteOrigin(r, c.origin); got != c.want {
			t.Errorf("isSameSiteOrigin(%q, %q) = %v, want %v", c.host, c.origin, got, c.want)
		}
	}
}
