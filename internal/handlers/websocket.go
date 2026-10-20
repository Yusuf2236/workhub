package handlers

import (
	"net/http"

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

// isSameSiteOrigin accepts pages served from the same host as the API (any port).
func isSameSiteOrigin(r *http.Request, origin string) bool {
	return middleware.IsSameHostOrigin(r, origin)
}
