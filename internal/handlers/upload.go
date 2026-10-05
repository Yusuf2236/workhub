package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
)

const (
	maxAvatarSize = 5 << 20  // 5 MB
	maxResumeSize = 10 << 20 // 10 MB
)

var avatarTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/gif":  ".gif",
	"image/webp": ".webp",
}

var resumeExtensions = map[string]bool{
	".pdf":  true,
	".doc":  true,
	".docx": true,
	".rtf":  true,
	".txt":  true,
	".odt":  true,
}

func sniffContentType(file *multipart.FileHeader) (string, error) {
	f, err := file.Open()
	if err != nil {
		return "", err
	}
	defer f.Close()
	buf := make([]byte, 512)
	n, err := io.ReadFull(f, buf)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return "", err
	}
	return http.DetectContentType(buf[:n]), nil
}

// validateAvatar returns the safe file extension for an uploaded image, determined
// from the file's content rather than its client-supplied name.
func validateAvatar(file *multipart.FileHeader) (string, error) {
	if file.Size > maxAvatarSize {
		return "", fmt.Errorf("rasm hajmi 5 MB dan oshmasligi kerak")
	}
	ct, err := sniffContentType(file)
	if err != nil {
		return "", fmt.Errorf("faylni o‘qib bo‘lmadi")
	}
	ext, ok := avatarTypes[ct]
	if !ok {
		return "", fmt.Errorf("faqat JPG, PNG, GIF yoki WEBP rasm yuklash mumkin")
	}
	return ext, nil
}

func validateResumeFile(file *multipart.FileHeader) (string, error) {
	if file.Size > maxResumeSize {
		return "", fmt.Errorf("fayl hajmi 10 MB dan oshmasligi kerak")
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !resumeExtensions[ext] {
		return "", fmt.Errorf("faqat PDF, DOC, DOCX, RTF, ODT yoki TXT fayl yuklash mumkin")
	}
	ct, err := sniffContentType(file)
	if err != nil {
		return "", fmt.Errorf("faylni o‘qib bo‘lmadi")
	}
	if strings.HasPrefix(ct, "text/html") || strings.HasPrefix(ct, "text/xml") || strings.Contains(ct, "javascript") {
		return "", fmt.Errorf("ushbu turdagi fayl ruxsat etilmagan")
	}
	return ext, nil
}
