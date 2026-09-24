package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Success(c *gin.Context, status int, payload any) {
	c.JSON(status, gin.H{"success": true, "data": payload})
}

func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "error": message, "status": http.StatusText(status)})
}
