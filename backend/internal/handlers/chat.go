package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/middleware"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type WsClient struct {
	conn      *websocket.Conn
	roomID    string
	userID    string
	userName  string
	avatarURL string
	send      chan []byte
	isClosed  bool
	mu        sync.Mutex
}

func (c *WsClient) safeSend(data []byte) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.isClosed {
		return
	}
	select {
	case c.send <- data:
	default:
	}
}

func (c *WsClient) safeClose() {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.isClosed {
		c.isClosed = true
		close(c.send)
	}
}

type ChatHub struct {
	rooms      map[string]map[*WsClient]bool
	broadcast  chan models.ChatMessage
	register   chan *WsClient
	unregister chan *WsClient
	mu         sync.RWMutex
}

var globalHub = newChatHub()

func newChatHub() *ChatHub {
	h := &ChatHub{
		rooms:      make(map[string]map[*WsClient]bool),
		broadcast:  make(chan models.ChatMessage, 256),
		register:   make(chan *WsClient),
		unregister: make(chan *WsClient),
	}
	go h.run()
	return h
}

func (h *ChatHub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.rooms[client.roomID] == nil {
				h.rooms[client.roomID] = make(map[*WsClient]bool)
			}
			h.rooms[client.roomID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.rooms[client.roomID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					client.safeClose()
					if len(clients) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			h.mu.RLock()
			clients := h.rooms[msg.RoomID]
			data, err := json.Marshal(gin.H{
				"type":          "message",
				"id":            msg.ID,
				"room_id":       msg.RoomID,
				"user_id":       msg.UserID,
				"sender_name":   msg.SenderName,
				"sender_avatar": msg.SenderAvatar,
				"content":       msg.Content,
				"created_at":    msg.CreatedAt.Format(time.RFC3339),
			})
			if err == nil {
				for client := range clients {
					client.safeSend(data)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (c *WsClient) writePump() {
	defer func() {
		_ = c.conn.Close()
	}()
	for message := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
			return
		}
	}
}

func (c *WsClient) readPump(h *ChatHub) {
	defer func() {
		h.unregister <- c
		_ = c.conn.Close()
	}()

	c.conn.SetReadLimit(65536)
	windowStart, sentInWindow := time.Now(), 0

	for {
		_, rawMsg, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		content := string(rawMsg)
		if content == "ping" {
			c.safeSend([]byte(`{"type":"pong"}`))
			continue
		}

		var incoming struct {
			Type         string `json:"type"`
			Content      string `json:"content"`
			SenderName   string `json:"sender_name"`
			SenderAvatar string `json:"sender_avatar"`
			RoomID       string `json:"room_id"`
		}
		if err := json.Unmarshal(rawMsg, &incoming); err == nil {
			if incoming.Type == "ping" {
				c.safeSend([]byte(`{"type":"pong"}`))
				continue
			}
			if incoming.Content != "" {
				content = incoming.Content
			}
			// Prevent spoofing: Only allow unauthenticated guests without an assigned name to set their name
			if (c.userID == "" || c.userID == "guest") && (c.userName == "" || c.userName == "WZone Mehmon") && strings.TrimSpace(incoming.SenderName) != "" {
				name := strings.TrimSpace(incoming.SenderName)
				if len([]rune(name)) > 80 {
					name = string([]rune(name)[:80])
				}
				c.userName = name
			}
		}

		content = strings.TrimSpace(content)
		if len(content) == 0 || len(content) > maxChatMessageLen {
			continue
		}

		// Flood protection: at most wsMessagesPerWindow messages per window per socket
		now := time.Now()
		if now.Sub(windowStart) >= wsRateWindow {
			windowStart, sentInWindow = now, 0
		}
		if sentInWindow >= wsMessagesPerWindow {
			c.safeSend([]byte(`{"type":"error","error":"Juda tez yozyapsiz, biroz kuting"}`))
			continue
		}
		sentInWindow++

		chatMsg := models.ChatMessage{
			ID:           uuid.NewString(),
			RoomID:       c.roomID,
			UserID:       c.userID,
			SenderName:   c.userName,
			SenderAvatar: c.avatarURL,
			Content:      content,
			CreatedAt:    now.UTC(),
		}

		if chatRepo != nil {
			_ = chatRepo.SaveMessage(chatMsg)
		}

		h.broadcast <- chatMsg
	}
}

const (
	maxChatMessageLen   = 4000
	wsMessagesPerWindow = 10
	wsRateWindow        = 10 * time.Second
)

// canAccessRoom enforces that direct-message rooms ("dm_<userA>_<userB>") are only
// readable/writable by their two participants. Public rooms are open to everyone.
func canAccessRoom(roomID, userID string) bool {
	if roomID == "" || len(roomID) > 120 {
		return false
	}
	for _, ch := range roomID {
		if !(ch == '-' || ch == '_' || (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
			return false
		}
	}
	if !strings.HasPrefix(roomID, "dm_") {
		return true
	}
	if userID == "" || userID == "guest" {
		return false
	}
	for _, participant := range strings.Split(strings.TrimPrefix(roomID, "dm_"), "_") {
		if participant == userID {
			return true
		}
	}
	return false
}

func ChatHealth(c *gin.Context) {
	globalHub.mu.RLock()
	activeRooms := len(globalHub.rooms)
	totalClients := 0
	for _, clients := range globalHub.rooms {
		totalClients += len(clients)
	}
	globalHub.mu.RUnlock()

	response.Success(c, http.StatusOK, gin.H{
		"status":       "chat-enabled",
		"endpoint":     "/api/v1/ws",
		"active_rooms": activeRooms,
		"active_users": totalClients,
		"timestamp":    time.Now().UTC().Format(time.RFC3339),
	})
}

func ListChatMessages(c *gin.Context) {
	roomID := c.Query("room")
	if roomID == "" {
		roomID = "general"
	}
	if !canAccessRoom(roomID, currentUserID(c)) {
		response.Error(c, http.StatusForbidden, "Bu suhbatga kirish huquqingiz yo‘q")
		return
	}

	if chatRepo != nil {
		history, err := chatRepo.ListByRoom(roomID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to load chat messages")
			return
		}
		response.Success(c, http.StatusOK, gin.H{
			"room_id":  roomID,
			"messages": history,
		})
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"room_id":  roomID,
		"messages": []models.ChatMessage{},
	})
}

func SendChatMessage(c *gin.Context) {
	var payload struct {
		RoomID       string `json:"room_id"`
		Content      string `json:"content" binding:"required"`
		SenderName   string `json:"sender_name"`
		SenderAvatar string `json:"sender_avatar"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, "Xabar matni kiritilishi shart")
		return
	}

	if payload.RoomID == "" {
		payload.RoomID = "general"
	}
	payload.Content = strings.TrimSpace(payload.Content)
	if payload.Content == "" || len(payload.Content) > maxChatMessageLen {
		response.Error(c, http.StatusBadRequest, "Xabar bo‘sh yoki juda uzun")
		return
	}

	userID := "guest"
	if uid := currentUserID(c); uid != "" {
		userID = uid
	}
	if !canAccessRoom(payload.RoomID, userID) {
		response.Error(c, http.StatusForbidden, "Bu suhbatga kirish huquqingiz yo‘q")
		return
	}

	senderName := strings.TrimSpace(payload.SenderName)
	senderAvatar := strings.TrimSpace(payload.SenderAvatar)
	if !isSafeLink(senderAvatar) {
		senderAvatar = ""
	}

	if userID != "guest" {
		// Authenticated users always appear under their own identity
		senderName = ""
		senderAvatar = ""
		if userRepo != nil {
			if u, _ := userRepo.GetByID(userID); u != nil {
				senderName = u.Name
				senderAvatar = u.AvatarURL
			}
		}
		if profileRepo != nil && senderAvatar == "" {
			if p, _ := profileRepo.GetByUserID(userID); p != nil && p.AvatarURL != "" {
				senderAvatar = p.AvatarURL
			}
		}
	}

	if senderName == "" {
		senderName = "WZone Mehmon"
	}

	chatMsg := models.ChatMessage{
		ID:           uuid.NewString(),
		RoomID:       payload.RoomID,
		UserID:       userID,
		SenderName:   senderName,
		SenderAvatar: senderAvatar,
		Content:      payload.Content,
		CreatedAt:    time.Now().UTC(),
	}

	if chatRepo != nil {
		_ = chatRepo.SaveMessage(chatMsg)
	}

	globalHub.broadcast <- chatMsg

	response.Success(c, http.StatusOK, gin.H{
		"message": chatMsg,
	})
}

func ListChatRooms(c *gin.Context) {
	rooms := []gin.H{
		{"id": "general", "name": "Umumiy IT Muloqot", "description": "Barcha IT mutaxassislar va qidiruvchilar uchun ochiq suhbat", "icon": "hash"},
		{"id": "ish-qidiruvchilar", "name": "Nomzodlar & Dasturchilar", "description": "Ish qidirayotgan dasturchilar va rezyume muhokamasi", "icon": "users"},
		{"id": "ish-beruvchilar", "name": "Ish beruvchilar & HR", "description": "HR menejerlar va kompaniya vakillari muloqoti", "icon": "briefcase"},
		{"id": "savol-javob", "name": "Savol-Javob & Intervyu", "description": "IT intervyulari, test savollari va maslahatlar", "icon": "help-circle"},
	}
	response.Success(c, http.StatusOK, gin.H{"rooms": rooms})
}

func HandleChatSocket(c *gin.Context) {
	roomID := c.Query("room")
	if roomID == "" {
		roomID = "general"
	}

	// Identity comes only from a verified JWT. The user_id query parameter is
	// ignored, otherwise anyone could impersonate another user.
	userID := "guest"
	userName := strings.TrimSpace(c.Query("user_name"))
	avatarURL := strings.TrimSpace(c.Query("avatar"))

	tokenStr := c.Query("token")
	if tokenStr == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if tokenStr != "" {
		claims, err := middleware.ParseValidToken(tokenStr)
		if err != nil || claims.UserID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "error": "invalid token"})
			return
		}
		userID = claims.UserID
		userName = ""
		avatarURL = ""
		if userRepo != nil {
			if u, _ := userRepo.GetByID(claims.UserID); u != nil {
				userName = u.Name
				avatarURL = u.AvatarURL
			}
		}
		if profileRepo != nil && avatarURL == "" {
			if p, _ := profileRepo.GetByUserID(claims.UserID); p != nil && p.AvatarURL != "" {
				avatarURL = p.AvatarURL
			}
		}
	}

	if !isSafeLink(avatarURL) {
		avatarURL = ""
	}
	if len([]rune(userName)) > 80 {
		userName = string([]rune(userName)[:80])
	}
	if userName == "" || userName == "guest" {
		userName = "WZone Mehmon"
	}

	if !canAccessRoom(roomID, userID) {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "error": "room access denied"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// Upgrade has already written an HTTP error response
		return
	}

	client := &WsClient{
		conn:      conn,
		roomID:    roomID,
		userID:    userID,
		userName:  userName,
		avatarURL: avatarURL,
		send:      make(chan []byte, 64),
	}

	globalHub.register <- client

	// Send past history
	if chatRepo != nil {
		if history, err := chatRepo.ListByRoom(roomID); err == nil {
			historyBytes, _ := json.Marshal(gin.H{
				"type":    "history",
				"room_id": roomID,
				"data":    history,
			})
			_ = conn.WriteMessage(websocket.TextMessage, historyBytes)
		}
	}

	go client.writePump()
	client.readPump(globalHub)
}
