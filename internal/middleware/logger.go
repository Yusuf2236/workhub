package middleware

import (
    "fmt"
    "time"

    "github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
    return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
        return fmt.Sprintf("[GIN] %s %s %s %s %s\n",
            param.Method,
            param.Path,
            param.ClientIP,
            param.TimeStamp.Format(time.RFC3339),
            param.Latency,
        )
    })
}
