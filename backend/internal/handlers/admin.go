package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListUsers(c *gin.Context) {
    usersList := make([]any, 0, len(users))
    for _, u := range users {
        usersList = append(usersList, u)
    }
    response.Success(c, http.StatusOK, gin.H{"users": usersList})
}

func AdminAnalytics(c *gin.Context) {
    response.Success(c, http.StatusOK, gin.H{
        "total_users": len(users),
        "total_vacancies": len(vacancies),
        "total_applications": len(applications),
        "total_resumes": len(resumes),
    })
}
