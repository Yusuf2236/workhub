package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

func ListUsers(c *gin.Context) {
	if userRepo != nil {
		usersList, err := userRepo.List()
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "failed to query users")
			return
		}
		response.Success(c, http.StatusOK, gin.H{"users": usersList})
		return
	}

	usersList := make([]any, 0, len(users))
	for _, u := range users {
		usersList = append(usersList, u)
	}
	response.Success(c, http.StatusOK, gin.H{"users": usersList})
}

func AdminAnalytics(c *gin.Context) {
	if userRepo != nil && vacancyRepo != nil && applicationRepo != nil && resumeRepo != nil {
		uCount, _ := userRepo.Count()
		vCount, _ := vacancyRepo.Count()
		aCount, _ := applicationRepo.Count()
		rCount, _ := resumeRepo.Count()

		response.Success(c, http.StatusOK, gin.H{
			"total_users":        uCount,
			"total_vacancies":    vCount,
			"total_applications": aCount,
			"total_resumes":      rCount,
		})
		return
	}

	response.Success(c, http.StatusOK, gin.H{
		"total_users":        len(users),
		"total_vacancies":    len(vacancies),
		"total_applications": len(applications),
		"total_resumes":      len(resumes),
	})
}
