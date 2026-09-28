package repositories

import (
	"database/sql"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type ChatRepo interface {
	SaveMessage(msg models.ChatMessage) error
	ListByRoom(roomID string) ([]models.ChatMessage, error)
	Count() (int, error)
}

type postgresChatRepo struct {
	db *sql.DB
}

func NewPostgresChatRepo(db *sql.DB) ChatRepo {
	return &postgresChatRepo{db: db}
}

func (r *postgresChatRepo) SaveMessage(msg models.ChatMessage) error {
	var uid interface{}
	if msg.UserID != "" && msg.UserID != "guest" {
		uid = msg.UserID
	} else {
		uid = nil
	}

	query := `
		INSERT INTO chat_messages (id, room_id, user_id, sender_name, sender_avatar, content, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(query, msg.ID, msg.RoomID, uid, msg.SenderName, msg.SenderAvatar, msg.Content, msg.CreatedAt)
	return err
}

func (r *postgresChatRepo) ListByRoom(roomID string) ([]models.ChatMessage, error) {
	query := `
		SELECT 
			m.id, m.room_id, COALESCE(m.user_id::text, ''), m.content, m.created_at,
			COALESCE(NULLIF(m.sender_name, ''), u.name, 'WZone Foydalanuvchisi') as sender_name,
			COALESCE(NULLIF(m.sender_avatar, ''), p.avatar_url, u.avatar_url, '') as sender_avatar
		FROM chat_messages m
		LEFT JOIN users u ON m.user_id = u.id
		LEFT JOIN profiles p ON m.user_id = p.user_id
		WHERE m.room_id = $1
		ORDER BY m.created_at ASC
		LIMIT 100`
	rows, err := r.db.Query(query, roomID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	msgs := []models.ChatMessage{}
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.RoomID, &m.UserID, &m.Content, &m.CreatedAt, &m.SenderName, &m.SenderAvatar); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, rows.Err()
}

func (r *postgresChatRepo) Count() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM chat_messages`).Scan(&count)
	return count, err
}
