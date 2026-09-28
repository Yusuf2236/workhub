package handlers

import (
	"math"
	"net/http"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
)

type VacancyMatch struct {
	Vacancy    models.Vacancy `json:"vacancy"`
	MatchScore int            `json:"match_score"` // Percentage 0 - 100
	MatchedTags []string      `json:"matched_tags"`
}

func GetRecommendations(c *gin.Context) {
	userID, ok := c.Get("user_id")
	if !ok {
		response.Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	if vacancyRepo == nil || resumeRepo == nil {
		response.Success(c, http.StatusOK, gin.H{"recommendations": []any{}})
		return
	}

	// 1. Get user's resumes
	userResumes, err := resumeRepo.ListByUser(userID.(string))
	if err != nil || len(userResumes) == 0 {
		// If no resume uploaded yet, return all vacancies with neutral score
		allVacancies, _ := vacancyRepo.List()
		items := make([]VacancyMatch, 0, len(allVacancies))
		for _, v := range allVacancies {
			items = append(items, VacancyMatch{
				Vacancy:     v,
				MatchScore:  70,
				MatchedTags: []string{"General Match"},
			})
		}
		response.Success(c, http.StatusOK, gin.H{"recommendations": items})
		return
	}

	// 2. Extract keywords from user resumes
	resumeText := ""
	for _, r := range userResumes {
		resumeText += " " + strings.ToLower(r.Title+" "+r.Summary)
	}

	techKeywords := []string{
		"go", "golang", "postgres", "postgresql", "redis", "docker", "kubernetes",
		"microservices", "architect", "android", "kotlin", "compose", "ios", "swift",
		"swiftui", "next.js", "react", "typescript", "python", "aws", "gcp",
	}

	userSkills := make(map[string]bool)
	for _, kw := range techKeywords {
		if strings.Contains(resumeText, kw) {
			userSkills[kw] = true
		}
	}

	// 3. Get all vacancies and calculate match score
	vacancies, err := vacancyRepo.List()
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
		return
	}

	var matches []VacancyMatch
	for _, v := range vacancies {
		vText := strings.ToLower(v.Title + " " + v.Description + " " + v.Company)
		var matched []string

		for skill := range userSkills {
			if strings.Contains(vText, skill) {
				matched = append(matched, strings.ToUpper(skill))
			}
		}

		var score int
		if len(userSkills) > 0 {
			rawScore := float64(len(matched)) / float64(len(userSkills)) * 100.0
			score = int(math.Min(98, math.Max(60, rawScore+40)))
		} else {
			score = 65
		}

		if len(matched) == 0 {
			matched = append(matched, "Role Compatibility")
		}

		matches = append(matches, VacancyMatch{
			Vacancy:     v,
			MatchScore:  score,
			MatchedTags: matched,
		})
	}

	// Sort highest match first
	sort.Slice(matches, func(i, j int) bool {
		return matches[i].MatchScore > matches[j].MatchScore
	})

	response.Success(c, http.StatusOK, gin.H{"recommendations": matches})
}
