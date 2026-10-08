package handlers

import (
	"net/http"
	"regexp"
	"sort"
	"strings"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type VacancyMatch struct {
	Vacancy     models.Vacancy `json:"vacancy"`
	MatchScore  int            `json:"match_score"` // share of the user's skills the vacancy mentions, 0-100
	MatchedTags []string       `json:"matched_tags"`
}

const maxRecommendationSkills = 12

// recommendationKeywords are looked for in resumes when the profile lists no skills
var recommendationKeywords = []string{
	"golang", "postgresql", "redis", "docker", "kubernetes", "microservices", "android", "kotlin",
	"ios", "swift", "react", "next.js", "typescript", "javascript", "python", "java", "php", "laravel",
	"1c", "sql", "figma", "excel", "smm", "marketing", "accounting", "buxgalter", "sotuv", "dizayn",
}

// containsWord matches whole words only, so "go" does not match "google" or "goal".
func containsWord(text, word string) bool {
	re, err := regexp.Compile(`(?i)(^|[^\p{L}\p{N}])` + regexp.QuoteMeta(word) + `($|[^\p{L}\p{N}])`)
	return err == nil && re.MatchString(text)
}

// userSkills collects skills from the profile, falling back to keywords found in resumes.
func userSkills(userID string) []string {
	var skills []string
	seen := map[string]bool{}
	add := func(s string) {
		s = strings.ToLower(strings.TrimSpace(s))
		if s == "" || seen[s] || len([]rune(s)) > 40 || len(skills) >= maxRecommendationSkills {
			return
		}
		seen[s] = true
		skills = append(skills, s)
	}

	if profileRepo != nil {
		if p, _ := profileRepo.GetByUserID(userID); p != nil {
			for _, s := range strings.Split(p.Skills, ",") {
				add(s)
			}
		}
	}
	if len(skills) == 0 && resumeRepo != nil {
		if resumes, _ := resumeRepo.ListByUser(userID); len(resumes) > 0 {
			var text strings.Builder
			for _, r := range resumes {
				text.WriteString(" " + r.Title + " " + r.Summary)
			}
			for _, kw := range recommendationKeywords {
				if containsWord(text.String(), kw) {
					add(kw)
				}
			}
		}
	}
	return skills
}

func GetRecommendations(c *gin.Context) {
	userID := currentUserID(c)
	if vacancyRepo == nil {
		response.Success(c, http.StatusOK, gin.H{"recommendations": []VacancyMatch{}})
		return
	}

	skills := userSkills(userID)
	if len(skills) == 0 {
		// Nothing to match on: ask the user to add skills instead of inventing scores
		response.Success(c, http.StatusOK, gin.H{"recommendations": []VacancyMatch{}, "needs_skills": true})
		return
	}

	// The repository already ranks vacancies mentioning the skills first
	candidates, _, err := vacancyRepo.ListFiltered("", "", "", "", skills, 1, 100)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to query vacancies")
		return
	}

	matches := []VacancyMatch{}
	for _, v := range candidates {
		text := v.Title + " " + v.Tags + " " + v.Description
		var matched []string
		for _, skill := range skills {
			if containsWord(text, skill) {
				matched = append(matched, skill)
			}
		}
		if len(matched) == 0 {
			continue
		}
		matches = append(matches, VacancyMatch{
			Vacancy:     v,
			MatchScore:  len(matched) * 100 / len(skills),
			MatchedTags: matched,
		})
	}

	sort.SliceStable(matches, func(i, j int) bool {
		return matches[i].MatchScore > matches[j].MatchScore
	})
	if len(matches) > 30 {
		matches = matches[:30]
	}

	response.Success(c, http.StatusOK, gin.H{"recommendations": matches})
}
