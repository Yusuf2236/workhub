package repositories

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Yusuf2236/workhub/backend/internal/models"
	"github.com/google/uuid"
)

type VacancyRepo interface {
	List() ([]models.Vacancy, error)
	ListFiltered(search, category, location, jobType string, skills []string, page, limit int) ([]models.Vacancy, int, error)
	Get(id string) (*models.Vacancy, error)
	ListByCreator(userID string) ([]models.Vacancy, error)
	ListByIDs(ids []string) ([]models.Vacancy, error)
	// ListForSitemap returns IDs and last-change times of the newest vacancies
	ListForSitemap(limit int) ([]SitemapEntry, error)
	Create(v models.Vacancy) error
	Update(v models.Vacancy) error
	Delete(id string) error
	IncrementViews(id string) error
	Count() (int, error)
}

// likeEscaper escapes LIKE wildcards so user-supplied skills match literally
var likeEscaper = strings.NewReplacer(`\`, `\\`, "%", `\%`, "_", `\_`)

type postgresVacancyRepo struct {
	db *sql.DB
}

func NewPostgresVacancyRepo(db *sql.DB) VacancyRepo {
	return &postgresVacancyRepo{db: db}
}

func (r *postgresVacancyRepo) List() ([]models.Vacancy, error) {
	vacs, _, err := r.ListFiltered("", "", "", "", nil, 1, 50)
	return vacs, err
}

func (r *postgresVacancyRepo) ListFiltered(search, category, location, jobType string, skills []string, page, limit int) ([]models.Vacancy, int, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	whereClause := " WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if strings.TrimSpace(search) != "" {
		whereClause += fmt.Sprintf(" AND (LOWER(title) LIKE LOWER($%d) OR LOWER(company) LIKE LOWER($%d) OR LOWER(tags) LIKE LOWER($%d) OR LOWER(description) LIKE LOWER($%d))", argIdx, argIdx, argIdx, argIdx)
		args = append(args, "%"+strings.TrimSpace(search)+"%")
		argIdx++
	}

	if strings.TrimSpace(category) != "" && strings.ToLower(category) != "all" && strings.ToLower(category) != "barchasi" {
		// Comma-separated list means "any of these categories" (used by the interests survey)
		var conds []string
		for _, cat := range strings.Split(category, ",") {
			cat = strings.TrimSpace(cat)
			if cat == "" {
				continue
			}
			catPrefix := strings.TrimSpace(strings.Split(cat, "&")[0])
			conds = append(conds, fmt.Sprintf("(LOWER(category) = LOWER($%d) OR LOWER(category) LIKE LOWER($%d) || '%%' OR LOWER($%d) LIKE '%%' || LOWER(category) || '%%')", argIdx, argIdx+1, argIdx+2))
			args = append(args, cat, catPrefix, cat)
			argIdx += 3
		}
		if len(conds) > 0 {
			whereClause += " AND (" + strings.Join(conds, " OR ") + ")"
		}
	}

	if strings.TrimSpace(location) != "" && strings.ToLower(location) != "all" && strings.ToLower(location) != "barchasi" {
		whereClause += fmt.Sprintf(" AND LOWER(location) LIKE LOWER($%d)", argIdx)
		args = append(args, "%"+strings.TrimSpace(location)+"%")
		argIdx++
	}

	if strings.TrimSpace(jobType) != "" && strings.ToLower(jobType) != "all" && strings.ToLower(jobType) != "barchasi" {
		whereClause += fmt.Sprintf(" AND LOWER(job_type) = LOWER($%d)", argIdx)
		args = append(args, strings.TrimSpace(jobType))
		argIdx++
	}

	// 1. Get total count
	var total int
	countQuery := "SELECT COUNT(*) FROM vacancies" + whereClause
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// New vacancies must always come first. A featured vacancy is only prioritized if it was created in the last 7 days.
	orderBy := "(CASE WHEN is_featured = true AND created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) DESC, created_at DESC, id DESC"
	if len(skills) > 0 {
		var score []string
		for _, sk := range skills {
			score = append(score, fmt.Sprintf("(CASE WHEN title ILIKE $%d OR tags ILIKE $%d OR description ILIKE $%d THEN 1 ELSE 0 END)", argIdx, argIdx, argIdx))
			args = append(args, "%"+likeEscaper.Replace(sk)+"%")
			argIdx++
		}
		orderBy = "(CASE WHEN is_featured = true AND created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) DESC, (" + strings.Join(score, " + ") + ") DESC, created_at DESC, id DESC"
	}

	// 2. Query paginated data
	dataQuery := fmt.Sprintf(`
		SELECT id, title, company, COALESCE(location, ''), COALESCE(description, ''),
		       COALESCE(salary, ''), COALESCE(category, 'IT & Dasturlash'), COALESCE(job_type, 'Full-time'),
		       COALESCE(experience, '1-3 yil'), COALESCE(tags, ''), COALESCE(company_logo, ''),
		       COALESCE(is_verified, true), COALESCE(is_featured, false), COALESCE(views_count, 0),
		       COALESCE((SELECT COUNT(*) FROM vacancy_comments vc WHERE vc.vacancy_id = vacancies.id), 0) AS comments_count,
		       COALESCE(source, 'WZone') AS source, COALESCE(source_url, ''),
		       COALESCE(created_by::text, ''), created_at, updated_at
		FROM vacancies
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d`, whereClause, orderBy, argIdx, argIdx+1)

	args = append(args, limit, offset)

	rows, err := r.db.Query(dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	vacancies := []models.Vacancy{}
	for rows.Next() {
		var v models.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Company, &v.Location, &v.Description,
			&v.Salary, &v.Category, &v.JobType, &v.Experience, &v.Tags,
			&v.CompanyLogo, &v.IsVerified, &v.IsFeatured, &v.ViewsCount,
			&v.CommentsCount, &v.Source, &v.SourceURL,
			&v.CreatedBy, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		vacancies = append(vacancies, v)
	}
	return vacancies, total, rows.Err()
}

func (r *postgresVacancyRepo) Get(id string) (*models.Vacancy, error) {
	if _, err := uuid.Parse(id); err != nil {
		return nil, nil
	}
	query := `
		SELECT id, title, company, COALESCE(location, ''), COALESCE(description, ''),
		       COALESCE(salary, ''), COALESCE(category, 'IT & Dasturlash'), COALESCE(job_type, 'Full-time'),
		       COALESCE(experience, '1-3 yil'), COALESCE(tags, ''), COALESCE(company_logo, ''),
		       COALESCE(is_verified, true), COALESCE(is_featured, false), COALESCE(views_count, 0),
		       COALESCE((SELECT COUNT(*) FROM vacancy_comments vc WHERE vc.vacancy_id = vacancies.id), 0) AS comments_count,
		       COALESCE(source, 'WZone') AS source, COALESCE(source_url, ''),
		       COALESCE(created_by::text, ''), created_at, updated_at
		FROM vacancies
		WHERE id = $1`
	var v models.Vacancy
	err := r.db.QueryRow(query, id).Scan(
		&v.ID, &v.Title, &v.Company, &v.Location, &v.Description,
		&v.Salary, &v.Category, &v.JobType, &v.Experience, &v.Tags,
		&v.CompanyLogo, &v.IsVerified, &v.IsFeatured, &v.ViewsCount,
		&v.CommentsCount, &v.Source, &v.SourceURL,
		&v.CreatedBy, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

const vacancyColumns = `
	SELECT id, title, company, COALESCE(location, ''), COALESCE(description, ''),
	       COALESCE(salary, ''), COALESCE(category, 'IT & Dasturlash'), COALESCE(job_type, 'Full-time'),
	       COALESCE(experience, '1-3 yil'), COALESCE(tags, ''), COALESCE(company_logo, ''),
	       COALESCE(is_verified, true), COALESCE(is_featured, false), COALESCE(views_count, 0),
	       COALESCE((SELECT COUNT(*) FROM vacancy_comments vc WHERE vc.vacancy_id = vacancies.id), 0) AS comments_count,
	       COALESCE(source, 'WZone') AS source, COALESCE(source_url, ''),
	       COALESCE(created_by::text, ''), created_at, updated_at
	FROM vacancies`

func scanVacancies(rows *sql.Rows) ([]models.Vacancy, error) {
	defer rows.Close()
	vacancies := []models.Vacancy{}
	for rows.Next() {
		var v models.Vacancy
		if err := rows.Scan(
			&v.ID, &v.Title, &v.Company, &v.Location, &v.Description,
			&v.Salary, &v.Category, &v.JobType, &v.Experience, &v.Tags,
			&v.CompanyLogo, &v.IsVerified, &v.IsFeatured, &v.ViewsCount,
			&v.CommentsCount, &v.Source, &v.SourceURL,
			&v.CreatedBy, &v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, err
		}
		vacancies = append(vacancies, v)
	}
	return vacancies, rows.Err()
}

func (r *postgresVacancyRepo) ListByCreator(userID string) ([]models.Vacancy, error) {
	if _, err := uuid.Parse(userID); err != nil {
		return []models.Vacancy{}, nil
	}
	rows, err := r.db.Query(vacancyColumns+` WHERE created_by = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	return scanVacancies(rows)
}

func (r *postgresVacancyRepo) ListByIDs(ids []string) ([]models.Vacancy, error) {
	if len(ids) == 0 {
		return []models.Vacancy{}, nil
	}
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}
	rows, err := r.db.Query(vacancyColumns+` WHERE id::text IN (`+strings.Join(placeholders, ",")+`) ORDER BY created_at DESC`, args...)
	if err != nil {
		return nil, err
	}
	return scanVacancies(rows)
}

type SitemapEntry struct {
	ID        string    `json:"id"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (r *postgresVacancyRepo) ListForSitemap(limit int) ([]SitemapEntry, error) {
	rows, err := r.db.Query(`SELECT id::text, updated_at FROM vacancies ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	entries := []SitemapEntry{}
	for rows.Next() {
		var e SitemapEntry
		if err := rows.Scan(&e.ID, &e.UpdatedAt); err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, rows.Err()
}

func (r *postgresVacancyRepo) Create(v models.Vacancy) error {
	query := `
		INSERT INTO vacancies (
			id, title, company, location, description, salary, category, job_type, experience, tags, company_logo, is_verified, is_featured, views_count, source, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NULLIF($16, '')::uuid, $17, $18
		)`
	if v.Category == "" {
		v.Category = "IT & Dasturlash"
	}
	if v.JobType == "" {
		v.JobType = "Full-time"
	}
	if v.Experience == "" {
		v.Experience = "1-3 yil"
	}
	if v.Source == "" {
		v.Source = "WZone"
	}
	_, err := r.db.Exec(
		query,
		v.ID, v.Title, v.Company, v.Location, v.Description, v.Salary,
		v.Category, v.JobType, v.Experience, v.Tags, v.CompanyLogo,
		v.IsVerified, v.IsFeatured, v.ViewsCount, v.Source, v.CreatedBy, v.CreatedAt, v.UpdatedAt,
	)
	return err
}

func (r *postgresVacancyRepo) Update(v models.Vacancy) error {
	query := `
		UPDATE vacancies
		SET title = $1, company = $2, location = $3, description = $4, salary = $5,
		    category = $6, job_type = $7, experience = $8, tags = $9, company_logo = $10,
		    is_verified = $11, is_featured = $12, views_count = $13, updated_at = $14
		WHERE id = $15`
	_, err := r.db.Exec(
		query,
		v.Title, v.Company, v.Location, v.Description, v.Salary,
		v.Category, v.JobType, v.Experience, v.Tags, v.CompanyLogo,
		v.IsVerified, v.IsFeatured, v.ViewsCount, v.UpdatedAt, v.ID,
	)
	return err
}

func (r *postgresVacancyRepo) Delete(id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return nil
	}
	_, err := r.db.Exec(`DELETE FROM vacancies WHERE id = $1`, id)
	return err
}

func (r *postgresVacancyRepo) IncrementViews(id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return nil
	}
	_, err := r.db.Exec(`UPDATE vacancies SET views_count = views_count + 1 WHERE id = $1`, id)
	return err
}

func (r *postgresVacancyRepo) Count() (int, error) {
	var count int
	err := r.db.QueryRow(`SELECT COUNT(*) FROM vacancies`).Scan(&count)
	return count, err
}
