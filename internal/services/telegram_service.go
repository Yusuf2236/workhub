package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
)

type TelegramService struct {
	botToken string
	chatID   string
	client   *http.Client
}

var tgService *TelegramService

// InitTelegramService initializes the global telegram service
func InitTelegramService() *TelegramService {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	chatID := os.Getenv("TELEGRAM_CHANNEL_ID")
	if chatID == "" {
		chatID = os.Getenv("TELEGRAM_ADMIN_CHAT_ID")
	}

	tgService = &TelegramService{
		botToken: token,
		chatID:   chatID,
		client:   &http.Client{Timeout: 10 * time.Second},
	}

	if token != "" {
		log.Println("[Telegram Service] Initialized successfully with bot token")
	} else {
		log.Println("[Telegram Service] No TELEGRAM_BOT_TOKEN configured, running in simulation mode")
	}

	return tgService
}

// GetTelegramService returns the global telegram instance
func GetTelegramService() *TelegramService {
	if tgService == nil {
		return InitTelegramService()
	}
	return tgService
}

// SendMessage sends an HTML-formatted message to Telegram
func (t *TelegramService) SendMessage(text string) error {
	if t.botToken == "" || t.chatID == "" {
		log.Printf("[Telegram Notification Simulated]: %s", text)
		return nil
	}

	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.botToken)
	payload := map[string]interface{}{
		"chat_id":    t.chatID,
		"text":       text,
		"parse_mode": "HTML",
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	resp, err := t.client.Post(apiURL, "application/json", bytes.NewBuffer(body))
	if err != nil {
		log.Printf("[Telegram Error] Failed to send message: %v", err)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Telegram Warning] HTTP status %d returned", resp.StatusCode)
	}

	return nil
}

// BroadcastVacancy broadcasts newly posted vacancy to Telegram channel
func (t *TelegramService) BroadcastVacancy(v *models.Vacancy) {
	if v == nil {
		return
	}

	text := fmt.Sprintf(
		"💼 <b>Yangi Vakansiya: %s</b>\n\n"+
			"🏢 <b>Kompaniya:</b> %s\n"+
			"📍 <b>Hudud:</b> %s\n"+
			"💰 <b>Maosh:</b> %s\n"+
			"📂 <b>Soha:</b> %s\n"+
			"⏰ <b>Bandlik:</b> %s\n\n"+
			"ℹ️ <b>Batafsil ma'lumot va ariza topshirish:</b>\n"+
			"https://workhub.uz/vacancies/%s\n\n"+
			"#workhub #vakansiya #ishbor",
		v.Title, v.Company, v.Location, v.Salary, v.Category, v.JobType, v.ID,
	)

	go func() {
		_ = t.SendMessage(text)
	}()
}

// NotifyNewApplication notifies about candidate application
func (t *TelegramService) NotifyNewApplication(applicantName, vacancyTitle, companyName string) {
	text := fmt.Sprintf(
		"📝 <b>Yangi Ariza Qabul Qilindi!</b>\n\n"+
			"👤 <b>Nomzod:</b> %s\n"+
			"💼 <b>Vakansiya:</b> %s\n"+
			"🏢 <b>Kompaniya:</b> %s\n"+
			"📅 <b>Vaqt:</b> %s",
		applicantName, vacancyTitle, companyName, time.Now().Format("02.01.2006 15:04"),
	)

	go func() {
		_ = t.SendMessage(text)
	}()
}

// NotifyOneIDVerified notifies admin when a citizen registers with OneID
func (t *TelegramService) NotifyOneIDVerified(fullName, pinfl, region string) {
	text := fmt.Sprintf(
		"🇺🇿 <b>Yangi OneID Tasdiqlangan Fuqaro!</b>\n\n"+
			"👤 <b>F.I.O:</b> %s\n"+
			"🆔 <b>JShShIR:</b> %s\n"+
			"📍 <b>Hudud:</b> %s\n"+
			"📅 <b>Vaqt:</b> %s",
		fullName, pinfl, region, time.Now().Format("02.01.2006 15:04"),
	)

	go func() {
		_ = t.SendMessage(text)
	}()
}
