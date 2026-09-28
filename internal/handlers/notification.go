package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListNotifications(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if notificationRepo != nil {
		items, err := notificationRepo.ListByUser(userID.(string))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query notifications")
			return
		}
		unreadCount, _ := notificationRepo.CountUnread(userID.(string))
		response.Success(c, http.StatusOK, gin.H{
			"notifications": items,
			"unread_count":  unreadCount,
		})
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"notifications": []any{},
		"unread_count":  0,
	})
}

func MarkNotificationRead(c *gin.Context) {
	id := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if notificationRepo != nil {
		if err := notificationRepo.MarkAsRead(id, userID.(string)); err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to update notification")
			return
		}
	}

	response.Success(c, http.StatusOK, gin.H{"status": "marked_as_read"})
}
