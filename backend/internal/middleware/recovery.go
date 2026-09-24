package middleware

import (
    "github.com/gin-gonic/gin"
)

func Recovery() gin.HandlerFunc {
    return gin.CustomRecovery(func(c *gin.Context, recovered any) {
        c.AbortWithStatusJSON(500, gin.H{"error": "internal server error"})
    })
}
