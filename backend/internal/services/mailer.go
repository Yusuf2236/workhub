package services

import (
	"crypto/tls"
	"log"
	"mime"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"
)

// Mailer sends transactional email over SMTP. Configure it with SMTP_HOST, SMTP_PORT
// (587 STARTTLS or 465 TLS), SMTP_USER, SMTP_PASSWORD and SMTP_FROM.
type Mailer struct {
	host, port, user, password, from string
}

// NewMailerFromEnv returns nil when SMTP is not configured.
func NewMailerFromEnv() *Mailer {
	m := &Mailer{
		host:     strings.TrimSpace(os.Getenv("SMTP_HOST")),
		port:     strings.TrimSpace(os.Getenv("SMTP_PORT")),
		user:     strings.TrimSpace(os.Getenv("SMTP_USER")),
		password: os.Getenv("SMTP_PASSWORD"),
		from:     strings.TrimSpace(os.Getenv("SMTP_FROM")),
	}
	if m.host == "" || m.from == "" {
		return nil
	}
	if m.port == "" {
		m.port = "587"
	}
	return m
}

func (m *Mailer) Send(to, subject, body string) error {
	msg := strings.Join([]string{
		"From: " + m.from,
		"To: " + to,
		"Subject: " + mime.QEncoding.Encode("utf-8", subject),
		"Date: " + time.Now().Format(time.RFC1123Z),
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=utf-8",
		"",
		body,
	}, "\r\n")

	addr := net.JoinHostPort(m.host, m.port)
	var auth smtp.Auth
	if m.user != "" {
		auth = smtp.PlainAuth("", m.user, m.password, m.host)
	}
	if m.port != "465" {
		// smtp.SendMail upgrades to STARTTLS when the server offers it
		return smtp.SendMail(addr, auth, envelopeAddress(m.from), []string{to}, []byte(msg))
	}

	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: m.host})
	if err != nil {
		return err
	}
	client, err := smtp.NewClient(conn, m.host)
	if err != nil {
		return err
	}
	defer client.Close()
	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}
	if err := client.Mail(envelopeAddress(m.from)); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := w.Write([]byte(msg)); err != nil {
		return err
	}
	if err := w.Close(); err != nil {
		return err
	}
	return client.Quit()
}

// envelopeAddress extracts "noreply@x.uz" from `WZone <noreply@x.uz>`.
func envelopeAddress(from string) string {
	if i := strings.LastIndex(from, "<"); i >= 0 {
		return strings.TrimSuffix(from[i+1:], ">")
	}
	return from
}

var mailer = NewMailerFromEnv()

// MailEnabled reports whether outgoing email is configured.
func MailEnabled() bool { return mailer != nil }

// SendMail delivers an email in the background. Without SMTP the message is only
// logged in development; in production it is dropped with a warning (it may hold a secret link).
func SendMail(to, subject, body string, production bool) {
	if mailer == nil {
		if production {
			log.Printf("[Mail] SMTP is not configured; email %q to %s was not sent", subject, to)
		} else {
			log.Printf("[Mail] (dev, SMTP not configured) to=%s subject=%q\n%s", to, subject, body)
		}
		return
	}
	go func() {
		if err := mailer.Send(to, subject, body); err != nil {
			log.Printf("[Mail] sending %q to %s failed: %v", subject, to, err)
		}
	}()
}

// SiteURL is the public site address used in links (PUBLIC_SITE_URL).
func SiteURL() string {
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_SITE_URL")), "/")
	if base == "" {
		if strings.EqualFold(os.Getenv("APP_ENV"), "production") || strings.EqualFold(os.Getenv("GIN_MODE"), "release") || strings.EqualFold(os.Getenv("ENV"), "production") {
			base = "https://wzone.uz"
		} else {
			base = "http://localhost:3000"
		}
	}
	return base
}
