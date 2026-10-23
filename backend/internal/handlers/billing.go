package handlers

import (
	"crypto/md5"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func computeClickSign(str string) string {
	hasher := md5.New()
	hasher.Write([]byte(str))
	return hex.EncodeToString(hasher.Sum(nil))
}

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

	// Paid plans stay pending until the payment provider confirms the payment
	// through its signed webhook. Only the free plan is activated immediately.
	status := "pending"
	if amount == 0 {
		status = "active"
	}

	sub := models.Subscription{
		ID:        uuid.NewString(),
		UserID:    userID.(string),
		Plan:      planID,
		Status:    status,
		Amount:    amount,
		Currency:  currency,
		ExpiresAt: &expiresAt,
		CreatedAt: now,
		UpdatedAt: now,
	}

	provider := strings.ToLower(strings.TrimSpace(payload.Provider))
	if provider == "" {
		provider = "click"
	}

	payment := gin.H{
		"provider": provider,
		"status":   status,
		"amount":   amount,
		"currency": currency,
	}
	if amount > 0 {
		checkoutURL, err := buildCheckoutURL(provider, userID.(string), amount)
		if err != nil {
			response.Error(c, http.StatusServiceUnavailable, err.Error())
			return
		}
		payment["checkout_url"] = checkoutURL
	}

	if subscriptionRepo != nil {
		if err := subscriptionRepo.Create(sub); err != nil {
			response.Error(c, http.StatusInternalServerError, "Obunani yaratishda xatolik yuz berdi")
			return
		}
	}

	response.Success(c, http.StatusOK, gin.H{
		"subscription": sub,
		"payment":      payment,
	})
}

// buildCheckoutURL returns the provider payment page. The user ID is passed as the
// merchant transaction / account reference that the provider echoes in its webhook.
func buildCheckoutURL(provider, userID string, amount float64) (string, error) {
	switch provider {
	case "click":
		serviceID := os.Getenv("CLICK_SERVICE_ID")
		merchantID := os.Getenv("CLICK_MERCHANT_ID")
		if serviceID == "" || merchantID == "" {
			return "", fmt.Errorf("Click to‘lov tizimi sozlanmagan")
		}
		q := url.Values{}
		q.Set("service_id", serviceID)
		q.Set("merchant_id", merchantID)
		q.Set("amount", strconv.FormatFloat(amount, 'f', 2, 64))
		q.Set("transaction_param", userID)
		return "https://my.click.uz/services/pay?" + q.Encode(), nil
	case "payme":
		merchantID := os.Getenv("PAYME_MERCHANT_ID")
		if merchantID == "" {
			return "", fmt.Errorf("Payme to‘lov tizimi sozlanmagan")
		}
		// Payme expects amounts in tiyin
		params := fmt.Sprintf("m=%s;ac.user_id=%s;a=%d", merchantID, userID, int64(amount*100))
		return "https://checkout.paycom.uz/" + base64.StdEncoding.EncodeToString([]byte(params)), nil
	default:
		return "", fmt.Errorf("Noma’lum to‘lov tizimi: %s", provider)
	}
}

// planForAmount maps a paid amount (UZS) to the plan it buys.
func planForAmount(amount float64) (string, bool) {
	for _, p := range plans {
		price := p["price"].(float64)
		if price > 0 && amount == price {
			return p["id"].(string), true
		}
	}
	return "", false
}

func activateSubscription(userID, plan string, amount float64, providerName string) error {
	now := time.Now().UTC()
	expiresAt := now.Add(30 * 24 * time.Hour)
	if subscriptionRepo != nil {
		if err := subscriptionRepo.Create(models.Subscription{
			ID:        uuid.NewString(),
			UserID:    userID,
			Plan:      plan,
			Status:    "active",
			Amount:    amount,
			Currency:  "UZS",
			ExpiresAt: &expiresAt,
			CreatedAt: now,
			UpdatedAt: now,
		}); err != nil {
			return err
		}
	}
	if notificationRepo != nil {
		_ = notificationRepo.Create(models.Notification{
			ID:        uuid.NewString(),
			UserID:    userID,
			Title:     "To‘lov qabul qilindi (" + providerName + ")",
			Body:      "WZone " + strings.ToUpper(plan) + " obunangiz " + providerName + " orqali 30 kunga faollashtirildi.",
			CreatedAt: now,
		})
	}
	return nil
}

func userExists(userID string) bool {
	if userRepo == nil {
		for _, u := range users {
			if u.ID == userID {
				return true
			}
		}
		return false
	}
	u, err := userRepo.GetByID(userID)
	return err == nil && u != nil
}

func GetMySubscription(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if subscriptionRepo != nil {
		sub, err := subscriptionRepo.GetActiveByUserID(userID.(string))
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
	merchantPrepareID := c.PostForm("merchant_prepare_id")
	amountStr := c.PostForm("amount")
	actionStr := c.PostForm("action")
	signTime := c.PostForm("sign_time")
	signString := c.PostForm("sign_string")
	clickError, _ := strconv.Atoi(c.PostForm("error"))

	log.Printf("[Click Webhook]: click_trans_id=%s, merchant_trans_id=%s, amount=%s, action=%s, error=%d",
		clickTransID, merchantTransID, amountStr, actionStr, clickError)

	clickReply := func(code int, note string, extra gin.H) {
		body := gin.H{
			"click_trans_id":    clickTransID,
			"merchant_trans_id": merchantTransID,
			"error":             code,
			"error_note":        note,
		}
		for k, v := range extra {
			body[k] = v
		}
		c.JSON(http.StatusOK, body)
	}

	secretKey := os.Getenv("CLICK_SECRET_KEY")
	if secretKey == "" {
		log.Printf("[Click Webhook]: CLICK_SECRET_KEY is not configured, rejecting request")
		clickReply(-1, "SIGN CHECK FAILED", nil)
		return
	}
	if expected := os.Getenv("CLICK_SERVICE_ID"); expected != "" && serviceID != expected {
		clickReply(-1, "SIGN CHECK FAILED", nil)
		return
	}

	action, err := strconv.Atoi(actionStr)
	if err != nil || (action != 0 && action != 1) {
		clickReply(-3, "Action not found", nil)
		return
	}

	var expectedSign string
	if action == 0 {
		expectedSign = computeClickSign(clickTransID + serviceID + secretKey + merchantTransID + amountStr + actionStr + signTime)
	} else {
		expectedSign = computeClickSign(clickTransID + serviceID + secretKey + merchantTransID + merchantPrepareID + amountStr + actionStr + signTime)
	}

	if signString == "" || subtle.ConstantTimeCompare([]byte(strings.ToLower(signString)), []byte(expectedSign)) != 1 {
		log.Printf("[Click Webhook]: invalid signature for click_trans_id=%s", clickTransID)
		clickReply(-1, "SIGN CHECK FAILED", nil)
		return
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		clickReply(-2, "Incorrect parameter amount", nil)
		return
	}
	plan, ok := planForAmount(amount)
	if !ok {
		clickReply(-2, "Incorrect parameter amount", nil)
		return
	}
	if merchantTransID == "" || !userExists(merchantTransID) {
		clickReply(-5, "User does not exist", nil)
		return
	}

	// Action 0 = Prepare, Action 1 = Complete
	if action == 0 {
		clickReply(0, "Success", gin.H{"merchant_prepare_id": 1})
		return
	}

	// Click reports a failed/cancelled payment with a negative error code
	if clickError < 0 {
		clickReply(-9, "Transaction cancelled", nil)
		return
	}

	if err := activateSubscription(merchantTransID, plan, amount, "Click"); err != nil {
		log.Printf("[Click Webhook]: failed to activate subscription: %v", err)
		clickReply(-7, "Failed to update user", nil)
		return
	}

	clickReply(0, "Success", gin.H{"merchant_confirm_id": 1})
}

type paymeTx struct {
	ID          string
	PaymeID     string
	UserID      string
	Amount      float64
	Plan        string
	State       int // 1: created, 2: performed, -1/-2: cancelled
	CreateTime  int64
	PerformTime int64
	CancelTime  int64
	Reason      int
}

var (
	paymeTxMu sync.RWMutex
	paymeTxs  = make(map[string]*paymeTx)
)

func getPaymeAccountUserID(params map[string]interface{}) string {
	if acc, ok := params["account"].(map[string]interface{}); ok {
		for _, key := range []string{"user_id", "merchant_trans_id", "id", "userId"} {
			if v, ok := acc[key].(string); ok && strings.TrimSpace(v) != "" {
				return strings.TrimSpace(v)
			}
		}
	}
	return ""
}

func getPaymeAmount(params map[string]interface{}) float64 {
	if a, ok := params["amount"].(float64); ok {
		// Payme sends amount in tiyin (1 UZS = 100 tiyin)
		return a / 100.0
	}
	return 0
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

	// Payme authenticates with HTTP Basic "Paycom:<merchant key>"
	paymeKey := os.Getenv("PAYME_KEY")
	expectedAuth := "Basic " + base64.StdEncoding.EncodeToString([]byte("Paycom:"+paymeKey))
	if paymeKey == "" || subtle.ConstantTimeCompare([]byte(c.GetHeader("Authorization")), []byte(expectedAuth)) != 1 {
		c.JSON(http.StatusOK, gin.H{
			"error": gin.H{"code": -32504, "message": "Insufficient privilege to perform this method"},
			"id":    rpcReq.ID,
		})
		return
	}

	log.Printf("[Payme Webhook]: method=%s", rpcReq.Method)
	nowMs := time.Now().UnixNano() / int64(time.Millisecond)

	switch rpcReq.Method {
	case "CheckPerformTransaction":
		userID := getPaymeAccountUserID(rpcReq.Params)
		if userID == "" || !userExists(userID) {
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31050, "message": gin.H{"uz": "Foydalanuvchi topilmadi", "ru": "Пользователь не найден", "en": "User not found"}},
				"id":    rpcReq.ID,
			})
			return
		}
		amount := getPaymeAmount(rpcReq.Params)
		if _, ok := planForAmount(amount); !ok {
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31001, "message": gin.H{"uz": "Noto‘g‘ri to‘lov summasi", "ru": "Неверная сумма", "en": "Incorrect amount"}},
				"id":    rpcReq.ID,
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{"allow": true},
			"id":     rpcReq.ID,
		})

	case "CreateTransaction":
		paymeID, _ := rpcReq.Params["id"].(string)
		if paymeID == "" {
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31008, "message": "Transaction id required"},
				"id":    rpcReq.ID,
			})
			return
		}

		paymeTxMu.Lock()
		existing, exists := paymeTxs[paymeID]
		if exists {
			paymeTxMu.Unlock()
			if existing.State == 1 {
				c.JSON(http.StatusOK, gin.H{
					"result": gin.H{
						"create_time": existing.CreateTime,
						"transaction": existing.ID,
						"state":       existing.State,
					},
					"id": rpcReq.ID,
				})
			} else {
				c.JSON(http.StatusOK, gin.H{
					"error": gin.H{"code": -31008, "message": "Transaction already finished"},
					"id":    rpcReq.ID,
				})
			}
			return
		}

		userID := getPaymeAccountUserID(rpcReq.Params)
		if userID == "" || !userExists(userID) {
			paymeTxMu.Unlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31050, "message": gin.H{"uz": "Foydalanuvchi topilmadi"}},
				"id":    rpcReq.ID,
			})
			return
		}

		amount := getPaymeAmount(rpcReq.Params)
		plan, ok := planForAmount(amount)
		if !ok {
			paymeTxMu.Unlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31001, "message": gin.H{"uz": "Noto‘g‘ri to‘lov summasi"}},
				"id":    rpcReq.ID,
			})
			return
		}

		tx := &paymeTx{
			ID:         "tx_" + uuid.NewString()[:8],
			PaymeID:    paymeID,
			UserID:     userID,
			Amount:     amount,
			Plan:       plan,
			State:      1,
			CreateTime: nowMs,
		}
		paymeTxs[paymeID] = tx
		paymeTxMu.Unlock()

		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{
				"create_time": tx.CreateTime,
				"transaction": tx.ID,
				"state":       tx.State,
			},
			"id": rpcReq.ID,
		})

	case "PerformTransaction":
		paymeID, _ := rpcReq.Params["id"].(string)
		paymeTxMu.Lock()
		tx, exists := paymeTxs[paymeID]
		if !exists {
			paymeTxMu.Unlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31003, "message": "Transaction not found"},
				"id":    rpcReq.ID,
			})
			return
		}

		if tx.State == 1 {
			if err := activateSubscription(tx.UserID, tx.Plan, tx.Amount, "Payme"); err != nil {
				paymeTxMu.Unlock()
				log.Printf("[Payme Webhook]: failed to activate subscription for user %s: %v", tx.UserID, err)
				c.JSON(http.StatusOK, gin.H{
					"error": gin.H{"code": -31008, "message": "Failed to activate subscription"},
					"id":    rpcReq.ID,
				})
				return
			}
			tx.State = 2
			tx.PerformTime = nowMs
		} else if tx.State != 2 {
			paymeTxMu.Unlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31008, "message": "Transaction is cancelled"},
				"id":    rpcReq.ID,
			})
			return
		}

		respResult := gin.H{
			"transaction":  tx.ID,
			"perform_time": tx.PerformTime,
			"state":        tx.State,
		}
		paymeTxMu.Unlock()

		c.JSON(http.StatusOK, gin.H{
			"result": respResult,
			"id":     rpcReq.ID,
		})

	case "CheckTransaction":
		paymeID, _ := rpcReq.Params["id"].(string)
		paymeTxMu.RLock()
		tx, exists := paymeTxs[paymeID]
		if !exists {
			paymeTxMu.RUnlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31003, "message": "Transaction not found"},
				"id":    rpcReq.ID,
			})
			return
		}

		respResult := gin.H{
			"create_time":  tx.CreateTime,
			"perform_time": tx.PerformTime,
			"cancel_time":  tx.CancelTime,
			"transaction":  tx.ID,
			"state":        tx.State,
			"reason":       tx.Reason,
		}
		paymeTxMu.RUnlock()

		c.JSON(http.StatusOK, gin.H{
			"result": respResult,
			"id":     rpcReq.ID,
		})

	case "CancelTransaction":
		paymeID, _ := rpcReq.Params["id"].(string)
		reason := 0
		if rFloat, ok := rpcReq.Params["reason"].(float64); ok {
			reason = int(rFloat)
		}
		paymeTxMu.Lock()
		tx, exists := paymeTxs[paymeID]
		if !exists {
			paymeTxMu.Unlock()
			c.JSON(http.StatusOK, gin.H{
				"error": gin.H{"code": -31003, "message": "Transaction not found"},
				"id":    rpcReq.ID,
			})
			return
		}
		if tx.State == 1 {
			tx.State = -1
		} else if tx.State == 2 {
			tx.State = -2
		}
		tx.CancelTime = nowMs
		tx.Reason = reason
		respResult := gin.H{
			"transaction": tx.ID,
			"cancel_time": tx.CancelTime,
			"state":       tx.State,
		}
		paymeTxMu.Unlock()

		c.JSON(http.StatusOK, gin.H{
			"result": respResult,
			"id":     rpcReq.ID,
		})

	default:
		c.JSON(http.StatusOK, gin.H{
			"result": gin.H{"success": true},
			"id":     rpcReq.ID,
		})
	}
}

func HandlePaymentWebhook(c *gin.Context) {
	secret := os.Getenv("PAYMENT_WEBHOOK_SECRET")
	if secret == "" {
		response.Error(c, http.StatusServiceUnavailable, "payment webhook is not configured")
		return
	}
	if subtle.ConstantTimeCompare([]byte(c.GetHeader("X-Webhook-Secret")), []byte(secret)) != 1 {
		response.Error(c, http.StatusUnauthorized, "invalid webhook signature")
		return
	}

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
