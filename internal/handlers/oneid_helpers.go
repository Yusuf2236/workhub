package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode"

	"github.com/Yusuf2236/workhub/backend/pkg/crypto"
	"github.com/Yusuf2236/workhub/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func parsePINFL(pinfl string) (gender, birthDate, region string) {
	pinfl = strings.TrimSpace(pinfl)
	if len(pinfl) != 14 {
		return "", "", ""
	}

	firstChar := pinfl[0]
	switch firstChar {
	case '1', '3', '5':
		gender = "Erkak"
	case '2', '4', '6':
		gender = "Ayol"
	default:
		gender = "Erkak"
	}

	yearPrefix := "19"
	switch firstChar {
	case '1', '2':
		yearPrefix = "18"
	case '5', '6':
		yearPrefix = "20"
	}

	day := pinfl[1:3]
	month := pinfl[3:5]
	year := yearPrefix + pinfl[5:7]
	birthDate = fmt.Sprintf("%s.%s.%s", day, month, year)

	regCode := pinfl[7:9]
	switch regCode {
	case "01", "02":
		region = "Andijon viloyati"
	case "03", "04":
		region = "Buxoro viloyati"
	case "05", "06":
		region = "Farg‘ona viloyati"
	case "07", "08":
		region = "Jizzax viloyati"
	case "09", "10":
		region = "Xorazm viloyati"
	case "11", "12":
		region = "Namangan viloyati"
	case "13", "14":
		region = "Navoiy viloyati"
	case "17", "18":
		region = "Qashqadaryo viloyati"
	case "19", "20":
		region = "Qoraqalpog‘iston Respublikasi"
	case "21", "22":
		region = "Samarqand viloyati"
	case "23", "24":
		region = "Sirdaryo viloyati"
	case "25", "26":
		region = "Surxondaryo viloyati"
	case "27":
		region = "Toshkent shahri"
	case "28", "29":
		region = "Toshkent viloyati"
	default:
		region = "Toshkent shahri"
	}

	return gender, birthDate, region
}

func OneIDQRGenerate(c *gin.Context) {
	if !oneIDQREnabled() {
		response.Error(c, http.StatusNotFound, "OneID QR orqali kirish o‘chirilgan")
		return
	}
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get("https://id.egov.uz/api/identity/auth/qr/generate")
	if err != nil {
		response.Error(c, http.StatusBadGateway, "OneID QR serveriga ulanishda xatolik: "+err.Error())
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		response.Error(c, http.StatusBadGateway, fmt.Sprintf("OneID server xatosi: HTTP %d", resp.StatusCode))
		return
	}

	var data struct {
		Code string `json:"code"`
		Hash string `json:"hash"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		response.Error(c, http.StatusInternalServerError, "OneID javobini o'qib bo'lmadi")
		return
	}

	if data.Code == "" || data.Hash == "" {
		response.Error(c, http.StatusBadGateway, "OneID QR ma'lumotlari bo'sh qaytdi")
		return
	}

	// The official OneID mobile app strictly expects base64 encoded JSON of {hash, code}
	rawPayload := fmt.Sprintf(`{"hash":"%s","code":"%s"}`, data.Hash, data.Code)
	qrString := base64.StdEncoding.EncodeToString([]byte(rawPayload))

	response.Success(c, http.StatusOK, gin.H{
		"code":      data.Code,
		"hash":      data.Hash,
		"qr_string": qrString,
	})
}

func formatWord(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	parts := strings.Fields(s)
	for i, p := range parts {
		pLower := strings.ToLower(p)
		switch pLower {
		case "o'g'li", "o‘g‘li", "oʻgʻli", "ogli":
			parts[i] = "o‘g‘li"
		case "qizi":
			parts[i] = "qizi"
		default:
			runes := []rune(pLower)
			if len(runes) > 0 {
				runes[0] = unicode.ToUpper(runes[0])
				parts[i] = string(runes)
			}
		}
	}
	return strings.Join(parts, " ")
}

func formatUzbekFullName(surname, name, patronymic string) string {
	sn := formatWord(surname)
	nl := formatWord(name)
	pl := formatWord(patronymic)
	return strings.TrimSpace(sn + " " + nl + " " + pl)
}

func saveBase64Avatar(pinfl, rawB64 string) string {
	rawB64 = strings.TrimSpace(rawB64)
	if rawB64 == "" {
		return ""
	}
	if idx := strings.Index(rawB64, ","); idx != -1 {
		rawB64 = rawB64[idx+1:]
	}
	imgBytes, err := base64.StdEncoding.DecodeString(rawB64)
	if err != nil {
		imgBytes, err = base64.RawStdEncoding.DecodeString(rawB64)
		if err != nil {
			log.Printf("[OneID Photo Decode Error]: %v", err)
			return ""
		}
	}
	if len(imgBytes) == 0 {
		return ""
	}

	dir := "./uploads/avatars"
	_ = os.MkdirAll(dir, 0755)
	cleanPinfl := strings.TrimSpace(pinfl)
	if cleanPinfl == "" {
		cleanPinfl = uuid.NewString()[:8]
	}
	anonHash := crypto.AnonymizeFilename(cleanPinfl)
	filename := fmt.Sprintf("oneid_%s.jpg", anonHash)
	filePath := filepath.Join(dir, filename)
	if err := os.WriteFile(filePath, imgBytes, 0644); err != nil {
		log.Printf("[OneID Photo Save Error]: %v", err)
		return ""
	}
	log.Printf("[OneID Photo Saved Successfully]: %s (%d bytes)", filePath, len(imgBytes))
	return fmt.Sprintf("/uploads/avatars/%s", filename)
}

func extractOneIDCitizenInfo(token string) (pinfl, fullName, birthDate, gender, location, email, phone, avatarURL string) {
	// 1. Decode JWT payload claims
	parts := strings.Split(token, ".")
	if len(parts) >= 2 {
		payloadSegment := parts[1]
		if l := len(payloadSegment) % 4; l > 0 {
			payloadSegment += strings.Repeat("=", 4-l)
		}
		decoded, err := base64.URLEncoding.DecodeString(payloadSegment)
		if err != nil {
			decoded, _ = base64.RawURLEncoding.DecodeString(parts[1])
		}
		if len(decoded) > 0 {
			var claims map[string]interface{}
			if err := json.Unmarshal(decoded, &claims); err == nil {
				if v, ok := claims["sub"].(string); ok && v != "" {
					if strings.Contains(v, "@") {
						email = strings.TrimSpace(v)
					} else if len(v) == 14 {
						pinfl = strings.TrimSpace(v)
					}
				}
				if v, ok := claims["pinfl"].(string); ok && v != "" {
					pinfl = strings.TrimSpace(v)
				} else if v, ok := claims["pin"].(string); ok && v != "" {
					pinfl = strings.TrimSpace(v)
				}
				if v, ok := claims["full_name"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				} else if v, ok := claims["name"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				} else if v, ok := claims["username"].(string); ok && v != "" {
					fullName = strings.TrimSpace(v)
				}
				if v, ok := claims["email"].(string); ok && v != "" {
					email = strings.TrimSpace(v)
				}
				if v, ok := claims["phone"].(string); ok && v != "" {
					phone = strings.TrimSpace(v)
				} else if v, ok := claims["mob_phone_no"].(string); ok && v != "" {
					phone = strings.TrimSpace(v)
				}
			}
		}
	}

	// 2. Fetch live official passport profile from id.egov.uz
	client := &http.Client{Timeout: 10 * time.Second}
	reqPass, err := http.NewRequest("GET", "https://id.egov.uz/api/passport/getUserPassport", nil)
	if err == nil {
		reqPass.Header.Set("Authorization", "Bearer "+token)
		reqPass.Header.Set("Accept", "application/json, text/plain, */*")
		reqPass.Header.Set("x-origin", "https://id.egov.uz")
		reqPass.Header.Set("Origin", "https://id.egov.uz")
		reqPass.Header.Set("Referer", "https://id.egov.uz/")
		reqPass.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqPass.Header.Set("x-fields", "pin,document,surnameLatin,nameLatin,patronymicLatin,surnameEn,nameEn,surnameCyr,nameCyr,patronymicCyr,birthDate,birthPlace,birthCountry,liveStatus,sex,issuePlace,photo")
		passResp, err := client.Do(reqPass)
		if err == nil {
			defer passResp.Body.Close()
			bodyBytes, _ := io.ReadAll(passResp.Body)
			log.Printf("[OneID Passport Raw HTTP %d]: (size %d bytes)", passResp.StatusCode, len(bodyBytes))
			if passResp.StatusCode == http.StatusOK && len(bodyBytes) > 0 {
				var pMap map[string]interface{}
				if err := json.Unmarshal(bodyBytes, &pMap); err == nil {
					targetMap := pMap
					if docs, ok := pMap["docs"].([]interface{}); ok && len(docs) > 0 {
						if d, ok := docs[0].(map[string]interface{}); ok {
							targetMap = d
						}
					}

					// PIN extraction
					if pNum, ok := targetMap["pin"].(float64); ok && pNum > 0 {
						pinfl = fmt.Sprintf("%.0f", pNum)
					} else if pStr, ok := targetMap["pin"].(string); ok && pStr != "" {
						pinfl = strings.TrimSpace(pStr)
					} else if pNum, ok := targetMap["pinfl"].(float64); ok && pNum > 0 {
						pinfl = fmt.Sprintf("%.0f", pNum)
					} else if pStr, ok := targetMap["pinfl"].(string); ok && pStr != "" {
						pinfl = strings.TrimSpace(pStr)
					} else if pins, ok := targetMap["pins"].([]interface{}); ok && len(pins) > 0 {
						if pNum, ok := pins[0].(float64); ok && pNum > 0 {
							pinfl = fmt.Sprintf("%.0f", pNum)
						} else if pStr, ok := pins[0].(string); ok && pStr != "" {
							pinfl = strings.TrimSpace(pStr)
						}
					}

					// Full Name extraction
					sn, _ := targetMap["surnameLatin"].(string)
					nl, _ := targetMap["nameLatin"].(string)
					pl, _ := targetMap["patronymicLatin"].(string)
					formattedName := formatUzbekFullName(sn, nl, pl)
					if formattedName != "" {
						fullName = formattedName
					}

					// Birth date extraction
					if bd, ok := targetMap["birthDate"].(string); ok && strings.TrimSpace(bd) != "" {
						bd = strings.TrimSpace(bd)
						if len(bd) == 10 && bd[4] == '-' && bd[7] == '-' {
							birthDate = fmt.Sprintf("%s.%s.%s", bd[8:10], bd[5:7], bd[0:4])
						} else {
							birthDate = bd
						}
					}

					// Sex extraction
					if sNum, ok := targetMap["sex"].(float64); ok {
						if int(sNum) == 1 {
							gender = "Erkak"
						} else if int(sNum) == 2 {
							gender = "Ayol"
						}
					} else if sStr, ok := targetMap["sex"].(string); ok {
						sStr = strings.TrimSpace(sStr)
						if sStr == "1" || strings.EqualFold(sStr, "m") || strings.EqualFold(sStr, "erkak") {
							gender = "Erkak"
						} else if sStr == "2" || strings.EqualFold(sStr, "f") || strings.EqualFold(sStr, "ayol") {
							gender = "Ayol"
						}
					}

					// Location extraction
					bp, _ := targetMap["birthPlace"].(string)
					ip, _ := targetMap["issuePlace"].(string)
					bp = strings.TrimSpace(bp)
					ip = strings.TrimSpace(ip)
					if ip != "" || bp != "" {
						reg := ""
						combinedUpper := strings.ToUpper(ip + " " + bp)
						if strings.Contains(combinedUpper, "NAVOIY") {
							reg = "Navoiy viloyati"
						} else if strings.Contains(combinedUpper, "TOSHKENT") {
							reg = "Toshkent shahri"
						} else if strings.Contains(combinedUpper, "SAMARQAND") {
							reg = "Samarqand viloyati"
						} else if strings.Contains(combinedUpper, "BUXORO") {
							reg = "Buxoro viloyati"
						} else if strings.Contains(combinedUpper, "FARG") {
							reg = "Farg‘ona viloyati"
						} else if strings.Contains(combinedUpper, "ANDIJON") {
							reg = "Andijon viloyati"
						} else if strings.Contains(combinedUpper, "NAMANGAN") {
							reg = "Namangan viloyati"
						} else if strings.Contains(combinedUpper, "QASHQADARYO") {
							reg = "Qashqadaryo viloyati"
						} else if strings.Contains(combinedUpper, "SURXONDARYO") {
							reg = "Surxondaryo viloyati"
						} else if strings.Contains(combinedUpper, "JIZZAX") {
							reg = "Jizzax viloyati"
						} else if strings.Contains(combinedUpper, "SIRDARYO") {
							reg = "Sirdaryo viloyati"
						} else if strings.Contains(combinedUpper, "XORAZM") {
							reg = "Xorazm viloyati"
						} else if strings.Contains(combinedUpper, "QORAQALPOG") {
							reg = "Qoraqalpog‘iston Respublikasi"
						}

						district := ""
						if bp != "" {
							district = formatWord(bp)
						}
						if reg != "" && district != "" {
							if strings.Contains(strings.ToLower(district), strings.ToLower(reg)) {
								location = district
							} else {
								location = reg + ", " + district
							}
						} else if reg != "" {
							location = reg
						} else if district != "" {
							location = district
						}
					}

					// Photo extraction
					if ph, ok := targetMap["photo"].(string); ok && len(ph) > 50 {
						avatarURL = saveBase64Avatar(pinfl, ph)
					}
				}
			}
		}
	}

	// 3. Normalise and validate PINFL. Never invent one: a fabricated PINFL would
	// map different citizens onto the same account.
	pinfl = normalizePINFL(pinfl)
	if pinfl != "" {
		dGender, dBirthDate, dRegion := parsePINFL(pinfl)
		if gender == "" {
			gender = dGender
		}
		if birthDate == "" {
			birthDate = dBirthDate
		}
		if location == "" {
			location = dRegion
		}
	}
	if fullName == "" {
		fullName = "OneID Fuqarosi"
	}

	return pinfl, fullName, birthDate, gender, location, email, phone, avatarURL
}
