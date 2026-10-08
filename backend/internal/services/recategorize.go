package services

import (
	"database/sql"
	"log"
	"strings"
)

// RecategorizeLegacyVacancies re-assigns categories of vacancies imported by the old
// scraper, which filed most postings under "IT & Dasturlash". User-posted vacancies and
// hh.uz imports (which already use categorizeVacancy) are left alone.
func RecategorizeLegacyVacancies(tx *sql.Tx) error {
	rows, err := tx.Query(`
		SELECT id::text, title, COALESCE(category, '')
		FROM vacancies
		WHERE created_by IS NULL AND external_id IS NULL`)
	if err != nil {
		return err
	}
	type change struct{ id, category string }
	var changes []change
	for rows.Next() {
		var id, title, current string
		if err := rows.Scan(&id, &title, &current); err != nil {
			rows.Close()
			return err
		}
		// Title only: the old scraper filled descriptions with generated IT-flavoured text
		category := categorizeVacancy(title)
		if category != current {
			changes = append(changes, change{id, category})
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	stmt, err := tx.Prepare(`UPDATE vacancies SET category = $2 WHERE id = $1`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, ch := range changes {
		if _, err := stmt.Exec(ch.id, ch.category); err != nil {
			return err
		}
	}
	log.Printf("[DB Migrate] re-categorized %d legacy vacancies", len(changes))
	return nil
}

// FixLegacyVacancyTags rewrites the first tag of old scraped vacancies ("IT, Part-time, Toshkent"),
// which repeats the category, so it matches the corrected category. Real skill tags
// (e.g. "Python, SQL") are left alone.
func FixLegacyVacancyTags(tx *sql.Tx) error {
	prefixes := map[string]bool{}
	for _, c := range categoryKeywords {
		prefixes[categoryTag(c.name)] = true
	}
	prefixes[categoryTag(fallbackCategory)] = true
	prefixes["Ta’lim"] = true

	rows, err := tx.Query(`
		SELECT id::text, tags, COALESCE(category, '')
		FROM vacancies
		WHERE created_by IS NULL AND external_id IS NULL AND COALESCE(tags, '') <> ''`)
	if err != nil {
		return err
	}
	type change struct{ id, tags string }
	var changes []change
	for rows.Next() {
		var id, tags, category string
		if err := rows.Scan(&id, &tags, &category); err != nil {
			rows.Close()
			return err
		}
		parts := strings.Split(tags, ",")
		first := strings.TrimSpace(parts[0])
		want := categoryTag(category)
		if prefixes[first] && first != want {
			parts[0] = want
			changes = append(changes, change{id, strings.Join(parts, ",")})
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	stmt, err := tx.Prepare(`UPDATE vacancies SET tags = $2 WHERE id = $1`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, ch := range changes {
		if _, err := stmt.Exec(ch.id, ch.tags); err != nil {
			return err
		}
	}
	log.Printf("[DB Migrate] fixed tags of %d legacy vacancies", len(changes))
	return nil
}

// categoryTag is the short form of a category used as a tag ("IT & Dasturlash" -> "IT").
func categoryTag(category string) string {
	return strings.TrimSpace(strings.Split(category, " & ")[0])
}
