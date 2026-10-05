package handlers

import (
	"net"
	"net/http"
	"net/url"
	"strings"

	"github.com/Yusuf2236/workhub/backend/internal/middleware"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		// Native mobile/desktop clients do not send an Origin header
		if origin == "" {
			return true
		}
		return middleware.IsOriginAllowed(origin) || isSameSiteOrigin(r, origin)
	},
}

// isSameSiteOrigin accepts pages served from the same host as the API (any port), e.g. the
// site behind nginx on its own domain or the web app on :3000 talking to the API on :8080.
func isSameSiteOrigin(r *http.Request, origin string) bool {
	u, err := url.Parse(origin)
	if err != nil || u.Hostname() == "" {
		return false
	}
	for _, h := range []string{r.Host, r.Header.Get("X-Forwarded-Host")} {
		h = strings.TrimSpace(strings.Split(h, ",")[0])
		if h == "" {
			continue
		}
		if host, _, err := net.SplitHostPort(h); err == nil {
			h = host
		}
		if strings.EqualFold(h, u.Hostname()) {
			return true
		}
	}
	return false
}
