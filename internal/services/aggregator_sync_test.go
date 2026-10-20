package services

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sort"
	"strconv"
	"sync"
	"testing"
	"time"
)

// fakeHH mimics the hh.ru search API: date_from/date_to filtering, newest first, and the
// 2000-result paging limit (pages beyond 20 are not served even when more match).
func fakeHH(t *testing.T, published []time.Time, failAfter int) *httptest.Server {
	var mu sync.Mutex
	calls := 0
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		calls++
		n := calls
		mu.Unlock()
		if failAfter > 0 && n > failAfter {
			w.WriteHeader(http.StatusBadGateway)
			return
		}
		q := r.URL.Query()
		from, err1 := time.Parse(hhTimeLayout, q.Get("date_from"))
		to, err2 := time.Parse(hhTimeLayout, q.Get("date_to"))
		if err1 != nil || err2 != nil {
			t.Errorf("bad dates %q %q", q.Get("date_from"), q.Get("date_to"))
		}
		var match []int
		for i, p := range published {
			if !p.Before(from) && !p.After(to) {
				match = append(match, i)
			}
		}
		sort.Slice(match, func(a, b int) bool { return published[match[a]].After(published[match[b]]) })
		page, _ := strconv.Atoi(q.Get("page"))
		pages := (len(match) + hhPerPage - 1) / hhPerPage
		if pages > hhMaxPages {
			pages = hhMaxPages
		}
		items := []hhVacancy{}
		if page < pages {
			for _, i := range match[page*hhPerPage : min(len(match), (page+1)*hhPerPage)] {
				items = append(items, hhVacancy{ID: strconv.Itoa(i), Name: "v", PublishedAt: published[i].Format(hhTimeLayout)})
			}
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"items": items, "pages": pages, "found": len(match)})
	}))
}

func newTestAggregator(url string) (*aggregator, map[string]bool) {
	seen := map[string]bool{}
	a := &aggregator{client: http.DefaultClient, token: "test", baseURL: url}
	a.store = func(_ context.Context, it hhVacancy) (bool, error) {
		isNew := !seen[it.ID]
		seen[it.ID] = true
		return isNew, nil
	}
	return a, seen
}

func TestSyncImportsMoreThanHHResultCap(t *testing.T) {
	// 5000 postings in the last ~2 days: one search could only page through 2000 of them
	now := time.Now().Truncate(time.Second)
	published := make([]time.Time, 5000)
	for i := range published {
		published[i] = now.Add(-time.Duration(i) * 30 * time.Second)
	}
	srv := fakeHH(t, published, 0)
	defer srv.Close()

	a, seen := newTestAggregator(srv.URL)
	a.sync()
	if len(seen) != len(published) {
		t.Fatalf("imported %d vacancies, want %d", len(seen), len(published))
	}
	if a.lastSync.IsZero() {
		t.Fatal("lastSync should advance after a complete sync")
	}
}

func TestSyncKeepsLastSyncOnError(t *testing.T) {
	now := time.Now().Truncate(time.Second)
	published := make([]time.Time, 300)
	for i := range published {
		published[i] = now.Add(-time.Duration(i) * time.Minute)
	}
	srv := fakeHH(t, published, 2) // the third request fails
	defer srv.Close()

	a, _ := newTestAggregator(srv.URL)
	prev := now.Add(-6 * time.Hour)
	a.lastSync = prev
	a.sync()
	if !a.lastSync.Equal(prev) {
		t.Fatalf("lastSync moved to %v after a failed sync; the missed period would never be retried", a.lastSync)
	}
}
