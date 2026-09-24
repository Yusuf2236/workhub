package models

type User struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Password  string `json:"-"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}

type Vacancy struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Company     string `json:"company"`
	Location    string `json:"location"`
	Description string `json:"description"`
	Salary      string `json:"salary,omitempty"`
	CreatedAt   string `json:"created_at"`
}

type Application struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	VacancyID string `json:"vacancy_id"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type Resume struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Title     string `json:"title"`
	Summary   string `json:"summary"`
	FileURL   string `json:"file_url,omitempty"`
	CreatedAt string `json:"created_at"`
}

type ChatMessage struct {
	ID        string `json:"id"`
	RoomID    string `json:"room_id"`
	UserID    string `json:"user_id"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}
