package migrations

import "embed"

// Files contains all embedded SQL migration and seed scripts
//go:embed *.sql
var Files embed.FS
