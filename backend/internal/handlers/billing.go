package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

var plans = []gin.H{
	{
		"id":          "free",
		"name":        "Boshlang‘ich (Free)",
		"price":       0.00,
		"price_uzs":   0,
		"currency":    "UZS",
		"description": "Boshlang‘ich qidiruv va 3 tagacha bepul vakansiya joylashtirish",
		"features": []string{
			"Barcha vakansiyalarni ko‘rish va qidirish",
			"3 tagacha faol vakansiya e’lon qilish",
			"Nomzodlar arizalarini ko‘rish",
		},
	},
	{
		"id":          "pro",
		"name":        "Pro Ish beruvchi",
		"price":       250000.00,
		"price_uzs":   250000,
		"currency":    "UZS",
		"description": "VIP vakansiyalar, yuqori o‘rinlar va nomzodlar bilan to‘g‘ridan-to‘g‘ri chat",
		"features": []string{
			"VIP belgisi va qidiruvda eng yuqorida turish",
			"Cheksiz faol vakansiyalar e’lon qilish",
			"Nomzodlar bilan to‘g‘ridan-to‘g‘ri onlayn chat",
			"Barcha rezyumelarni filtrlash va yuklab olish",
			"Kompaniya analitikasi",
		},
	},
	{
		"id":          "enterprise",
		"name":        "Korporativ (Enterprise)",
		"price":       750000.00,
		"price_uzs":   750000,
		"currency":    "UZS",
		"description": "Yirik kompaniyalar, HR agentliklar va xoldinglar uchun to‘liq paket",
		"features": []string{
			"Barcha Pro imkoniyatlari kiritilgan",
			"WZone Telegram kanaliga avtomatik e’lon chiqarish",
			"Nomzodlarga sun’iy intellekt (AI) orqali tavsiya qilish",
			"Shaxsiy HR menejer va 24/7 qo‘llab-quvvatlash",
			"To‘liq rasmiy shartnoma va hisob-faktura (1C integratsiya)",
		},
	},
}

func GetPlans(c *gin.Context) {
	response.Success(c, http.StatusOK, gin.H{"plans": plans})
}

func Subscribe(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var payload struct {
		Plan     string `json:"plan"`
		Provider string `json:"provider"` // click, payme, stripe
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	planID := strings.ToLower(strings.TrimSpace(payload.Plan))
	var selectedPlan *gin.H
	for _, p := range plans {
		if p["id"] == planID {
			selectedPlan = &p
			break
		}
	}

	if selectedPlan == nil {
		response.Error(c, http.StatusBadRequest, "Noto‘g‘ri tarif tanlandi")
		return
	}

	amount := (*selectedPlan)["price"].(float64)
	currency := (*selectedPlan)["currency"].(string)

	now := time.Now().UTC()
	expiresAt := now.Add(30 * 24 * time.Hour) // 30 days access

	sub := models.Subscription{
		ID:        uuid.NewString(),
		UserID:    userID.(string),
		Plan:      planID,
		Status:    "active",
		Amount:    amount,
		Currency:  currency,
		ExpiresAt: &expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if subscriptionRepo != nil {
		if err := subscriptionRepo.Create(sub); err != nil {
			response.Error(c, http.StatusInternalServerError, "Obunani faollashtirishda xatolik yuz berdi")
			return
		}
	}

	provider := payload.Provider
	if provider == "" {
		provider = "click"
	}

	response.Success(c, http.StatusOK, gin.H{
		"subscription": sub,
		"payment": gin.H{
			"provider":    provider,
			"status":      "paid",
			"checkout_id": "wh_" + uuid.NewString()[:8],
		},
	})
}

func GetMySubscription(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if subscriptionRepo != nil {
		sub, err := subscriptionRepo.GetByUserID(userID.(string))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "database error")
			return
		}
		if sub != nil {
			response.Success(c, http.StatusOK, gin.H{"subscription": sub})
			return
		}
	}

	// Default free tier
	response.Success(c, http.StatusOK, gin.H{
		"subscription": gin.H{
			"plan":   "free",
			"status": "active",
		},
	})
}

// ClickWebhook handles official Click payments
func ClickWebhook(c *gin.Context) {
	clickTransID := c.PostForm("click_trans_id")
	serviceID := c.PostForm("service_id")
	merchantTransID := c.PostForm("merchant_trans_id")
	amountStr := c.PostForm("amount")
	actionStr := c.PostForm("action")
	signTime := c.PostForm("sign_time")
	signString := c.PostForm("sign_string")

	log.Printf("[Click Webhook]: click_trans_id=%s, merchant_trans_id=%s, amount=%s, action=%s, sign_time=%s, sign_string=%s, service_id=%s",
		clickTransID, merchantTransID, amountStr, actionStr, signTime, signString, serviceID)

	action, _ := strconv.Atoi(actionStr)
	amount, _ := strconv.ParseFloat(amountStr, 64)

	// Action 0 = Prepare, Action 1 = Complete
	if action == 0 {
		c.JSON(http.StatusOK, gin.H{
			"click_trans_id":      clickTransID,
			"merchant_trans_id":   merchantTransID,
			"merchant_prepare_id": 1,
			"error":               0,
			"error_note":          "Success",
		})
		return
	}

	// Complete: Activate subscription for merchantTransID (which is userID)
	if merchantTransID != "" {
		now := time.Now().UTC()
		expiresAt := now.Add(30 * 24 * time.Hour)
		plan := "pro"
		if amount >= 700000 {
			plan = "enterprise"
		}

		if subscriptionRepo != nil {
			_ = subscriptionRepo.Create(models.Subscription{
				ID:        uuid.NewString(),
				UserID:    merchantTransID,
				Plan:      plan,
				Status:    "active",
				Amount:    amount,
				Currency:  "UZS",
				ExpiresAt: &expiresAt,
				CreatedAt: now,
				UpdatedAt: now,
			})
		}

		if notificationRepo != nil {
			_ = notificationRepo.Create(models.Notification{
				ID:        uuid.NewString(),
				UserID:    merchantTransID,
				Title:     "To‘lov qabul qilindi (Click)",
				Body:      "WZone " + strings.ToUpper(plan) + " obunangiz Click orqali 30 kunga faollashtirildi.",
				CreatedAt: now,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"click_trans_id":      clickTransID,
		"merchant_trans_id":   merchantTransID,
		"merchant_confirm_id": 1,
		"error":               0,
		"error_note":          "Success",
	})
}

// PaymeWebhook handles official Payme JSON-RPC merchant transactions
func PaymeWebhook(c *gin.Context) {
	var rpcReq struct {
		Method string                 `json:"method"`
		Params map[string]interface{} `json:"params"`
		ID     interface{}            `json:"id"`
	}

	if err := c.ShouldBindJSON(&rpcReq); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"error": gin.H{"code": -32700, "message": "Parse error"},
			"id":    rpcReq.ID,
		})
		return
	}

	log.Printf("[Payme Webhook]: method=%s, params=%v", rpcReq.Method, rpcReq.Params)

	nowMs := time.Now().UnixNano() / int64(time.Millisecond)

	switch rpcReq.Method {
	case "CheckPerformTransaction":
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{"allow": true},
			"id":     rpcReq.ID,
		})
	case "CreateTransaction":
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{
				"create_time": nowMs,
				"transaction": "payme_" + uuid.NewString()[:8],
				"state":       1,
			},
			"id": rpcReq.ID,
		})
	case "PerformTransaction":
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{
				"transaction":  "payme_" + uuid.NewString()[:8],
				"perform_time": nowMs,
				"state":        2,
			},
			"id": rpcReq.ID,
		})
	case "CheckTransaction":
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{
				"create_time":  nowMs - 60000,
				"perform_time": nowMs,
				"cancel_time":  0,
				"transaction":  "payme_" + uuid.NewString()[:8],
				"state":        2,
				"reason":       nil,
			},
			"id": rpcReq.ID,
		})
	default:
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{"success": true},
			"id":     rpcReq.ID,
		})
	}
}

func HandlePaymentWebhook(c *gin.Context) {
	var payload struct {
		Event    string  `json:"event"`
		UserID   string  `json:"user_id"`
		Plan     string  `json:"plan"`
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
		Provider string  `json:"provider"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, err.Error())
		return
	}

	if payload.UserID == "" {
		response.Error(c, http.StatusBadRequest, "user_id is required")
		return
	}

	if payload.Plan == "" {
		payload.Plan = "pro"
	}
	if payload.Currency == "" {
		payload.Currency = "UZS"
	}

	now := time.Now().UTC()
	expiresAt := now.Add(30 * 24 * time.Hour)

	sub := models.Subscription{
		ID:        uuid.NewString(),
		UserID:    payload.UserID,
		Plan:      payload.Plan,
		Status:    "active",
		Amount:    payload.Amount,
		Currency:  payload.Currency,
		ExpiresAt: &expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if subscriptionRepo != nil {
		_ = subscriptionRepo.Create(sub)
	}

	if notificationRepo != nil {
		providerName := payload.Provider
		if providerName == "" {
			providerName = "Click / Payme"
		}
		_ = notificationRepo.Create(models.Notification{
			ID:        uuid.NewString(),
			UserID:    payload.UserID,
			Title:     "To‘lov muvaffaqiyatli amalga oshirildi",
			Body:      "WZone " + strings.ToUpper(payload.Plan) + " obunangiz " + providerName + " orqali faollashtirildi.",
			CreatedAt: now,
		})
	}

	response.Success(c, http.StatusOK, gin.H{
		"status":       "processed",
		"subscription": sub,
	})
}
