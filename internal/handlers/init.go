package handlers

import (
	"database/sql"

	"github.com/go-redis/redis/v8"
	"github.com/Yusuf2236/workhub/backend/internal/repositories"
)

var (
	userRepo         repositories.UserRepo
	profileRepo      repositories.ProfileRepo
	vacancyRepo      repositories.VacancyRepo
	applicationRepo  repositories.ApplicationRepo
	resumeRepo       repositories.ResumeRepo
	chatRepo         repositories.ChatRepo
	notificationRepo repositories.NotificationRepo
	subscriptionRepo repositories.SubscriptionRepo
	commentRepo      repositories.CommentRepo
	redisClient      *redis.Client
)

func Init(db *sql.DB, rdb *redis.Client) {
	if db != nil {
		userRepo = repositories.NewPostgresUserRepo(db)
		profileRepo = repositories.NewPostgresProfileRepo(db)
		vacancyRepo = repositories.NewPostgresVacancyRepo(db)
		applicationRepo = repositories.NewPostgresApplicationRepo(db)
		resumeRepo = repositories.NewPostgresResumeRepo(db)
		chatRepo = repositories.NewPostgresChatRepo(db)
		notificationRepo = repositories.NewPostgresNotificationRepo(db)
		subscriptionRepo = repositories.NewPostgresSubscriptionRepo(db)
		commentRepo = repositories.NewPostgresCommentRepo(db)
	}
	redisClient = rdb
}
