package services

import (
	"log"
	"os/exec"
	"time"
)

// StartBackgroundAggregator runs the job scraper periodically in background
func StartBackgroundAggregator(interval time.Duration) {
	go func() {
		// Wait 1 minute after server start before running first background sync
		time.Sleep(1 * time.Minute)
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for {
			RunScraperSync()
			<-ticker.C
		}
	}()
}

// RunScraperSync triggers the automated python scraper
func RunScraperSync() {
	log.Println("[Aggregator] Starting automated vacancy scraper from hh.uz and olx.uz...")
	cmd := exec.Command("python3", "scripts/scrape_and_seed.py")
	cmd.Dir = "."
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[Aggregator] Scraper execution warning: %v\nOutput: %s", err, string(output))
		return
	}
	log.Println("[Aggregator] Vacancy scraper completed successfully!")
}
