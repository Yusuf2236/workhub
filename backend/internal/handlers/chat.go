package handlers

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
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

	for {
		_, rawMsg, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		content := string(rawMsg)
		var incoming struct {
			Content      string `json:"content"`
			SenderName   string `json:"sender_name"`
			SenderAvatar string `json:"sender_avatar"`
			RoomID       string `json:"room_id"`
		}
		if err := json.Unmarshal(rawMsg, &incoming); err == nil && incoming.Content != "" {
			content = incoming.Content
			if incoming.SenderName != "" {
				c.userName = incoming.SenderName
			}
			if incoming.SenderAvatar != "" {
				c.avatarURL = incoming.SenderAvatar
			}
		}

		if len(content) == 0 {
			continue
		}

		now := time.Now().UTC()
		chatMsg := models.ChatMessage{
			ID:           uuid.NewString(),
			RoomID:       c.roomID,
			UserID:       c.userID,
			SenderName:   c.userName,
			SenderAvatar: c.avatarURL,
			Content:      content,
			CreatedAt:    now,
		}

		if chatRepo != nil {
			_ = chatRepo.SaveMessage(chatMsg)
		}

		h.broadcast <- chatMsg
	}
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
		"status":        "chat-enabled",
		"endpoint":      "/api/v1/ws",
		"active_rooms":  activeRooms,
		"active_users":  totalClients,
		"timestamp":     time.Now().UTC().Format(time.RFC3339),
	})
}

func ListChatMessages(c *gin.Context) {
	roomID := c.Query("room")
	if roomID == "" {
		roomID = "general"
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

	userID := "guest"
	if uid, exists := c.Get("user_id"); exists && uid != nil {
		userID = uid.(string)
	}

	senderName := payload.SenderName
	senderAvatar := payload.SenderAvatar

	if userID != "" && userID != "guest" {
		if userRepo != nil {
			if u, _ := userRepo.GetByID(userID); u != nil {
				if senderName == "" {
					senderName = u.Name
				}
				if senderAvatar == "" {
					senderAvatar = u.AvatarURL
				}
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
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "failed to upgrade websocket connection")
		return
	}

	roomID := c.Query("room")
	if roomID == "" {
		roomID = "general"
	}

	userID := c.Query("user_id")
	userName := c.Query("user_name")
	avatarURL := c.Query("avatar")

	if userID != "" && userID != "guest" {
		if userRepo != nil {
			if u, _ := userRepo.GetByID(userID); u != nil {
				if userName == "" || userName == "guest" {
					userName = u.Name
				}
				if avatarURL == "" {
					avatarURL = u.AvatarURL
				}
			}
		}
		if profileRepo != nil && avatarURL == "" {
			if p, _ := profileRepo.GetByUserID(userID); p != nil && p.AvatarURL != "" {
				avatarURL = p.AvatarURL
			}
		}
	}
	if userName == "" || userName == "guest" {
		userName = "WZone Mehmon"
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
