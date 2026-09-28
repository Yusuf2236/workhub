package database

import (
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"

	"github.com/Yusuf2236/workhub/backend/migrations"
)

// AutoMigrate runs all embedded SQL migrations against the database in order
func AutoMigrate(db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("database connection is nil")
	}

	// 1. Create schema_migrations table if not exists
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		return fmt.Errorf("ensure schema_migrations table: %w", err)
	}

	// 2. Read embedded migrations
	entries, err := fs.ReadDir(migrations.Files, ".")
	if err != nil {
		return fmt.Errorf("read migrations: %w", err)
	}

	var filenames []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			filenames = append(filenames, entry.Name())
		}
	}
	sort.Strings(filenames)

	// 3. Apply each migration if not already recorded
	for _, fname := range filenames {
		var exists bool
		err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)", fname).Scan(&exists)
		if err != nil {
			return fmt.Errorf("check migration %s: %w", fname, err)
		}

		if exists {
			continue
		}

		log.Printf("[DB Migrate] Applying migration %s...", fname)
		content, err := fs.ReadFile(migrations.Files, fname)
		if err != nil {
			return fmt.Errorf("read migration content %s: %w", fname, err)
		}

		sqlContent := string(content)
		if strings.TrimSpace(sqlContent) == "" {
			continue
		}

		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("begin tx for %s: %w", fname, err)
		}

		if _, err := tx.Exec(sqlContent); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("exec migration %s: %w", fname, err)
		}

		if _, err := tx.Exec("INSERT INTO schema_migrations (version) VALUES ($1)", fname); err != nil {
			_ = tx.Rollback()
			return fmt.Errorf("record migration %s: %w", fname, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit migration %s: %w", fname, err)
		}

		log.Printf("[DB Migrate] Successfully applied %s", fname)
	}

	return nil
}
