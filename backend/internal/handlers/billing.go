package handlers

import (
	"net/http"
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
		"name":        "Free Starter",
		"price":       0.00,
		"currency":    "USD",
		"description": "Basic job search and up to 3 active vacancy listings",
		"features": []string{
			"Standard job search",
			"Up to 3 active vacancy postings",
			"Standard applicant tracking",
		},
	},
	{
		"id":          "pro",
		"name":        "Pro Employer",
		"price":       49.00,
		"currency":    "USD",
		"description": "Enhanced visibility with featured job placement and candidate messaging",
		"features": []string{
			"Featured vacancy placement",
			"Unlimited active job postings",
			"Direct candidate chat",
			"Advanced candidate filters",
			"Analytics dashboard",
		},
	},
	{
		"id":          "enterprise",
		"name":        "Enterprise Suite",
		"price":       199.00,
		"currency":    "USD",
		"description": "Full platform access for high-volume recruitment agencies and enterprises",
		"features": []string{
			"All Pro features included",
			"AI-powered candidate skill matching",
			"Dedicated API & ATS integration",
			"Custom reporting & SLA support",
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
		Provider string `json:"provider"` // stripe, payme, click
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
		response.Error(c, http.StatusBadRequest, "invalid plan selected")
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
			response.Error(c, http.StatusInternalServerError, "failed to activate subscription")
			return
		}
	}

	provider := payload.Provider
	if provider == "" {
		provider = "stripe"
	}

	response.Success(c, http.StatusOK, gin.H{
		"subscription": sub,
		"payment": gin.H{
			"provider":    provider,
			"status":      "paid",
			"checkout_id": fmtSprintf("chk_%s", uuid.NewString()[:8]),
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
		payload.Currency = "USD"
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
			providerName = "Payment Provider"
		}
		_ = notificationRepo.Create(models.Notification{
			ID:        uuid.NewString(),
			UserID:    payload.UserID,
			Title:     "Payment Succeeded",
			Body:      "Your " + strings.ToUpper(payload.Plan) + " subscription has been activated successfully via " + providerName + ".",
			CreatedAt: now,
		})
	}

	response.Success(c, http.StatusOK, gin.H{
		"status":       "processed",
		"subscription": sub,
	})
}

func fmtSprintf(format string, a ...any) string {
	return uuid.NewString()[:8]
}

