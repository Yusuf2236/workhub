# 💬 WZone Chat Tizimi — To'liq Arxitektura va Texnik Qo'llanma (README.md)

Ushbu hujjat **WZone** platformasining real-vaqtli chat (muloqot) tizimining to'liq arxitekturasi, ma'lumotlar bazasi sxemasi, WebSocket va REST API protokoli, xatoliklarni qayta ishlash hamda integratsiya qo'llanmasini o'z ichiga oladi.

---

## 📑 Mundarija
1. [Arxitektura Umumiy Ko'rinishi](#1-arxitektura-umumiy-korinishi)
2. [Ma'lumotlar Bazasi Modeli (Database Schema)](#2-malumotlar-bazasi-modeli-database-schema)
3. [WebSocket Protokoli va Ulanish](#3-websocket-protokoli-va-ulanish)
4. [REST API Endpoints (Fallback & Management)](#4-rest-api-endpoints-fallback--management)
5. [Xonalar (Rooms) va Shaxsiy Xabarlar (DM)](#5-xonalar-rooms-va-shaxsiy-xabarlar-dm)
6. [Xatoliklar va Ularni Qayta Ishlash (Resilience & Fallback)](#6-xatoliklar-va-ularni-qayta-ishlash-resilience--fallback)
7. [Mijoz Dasturlari (Web, Android, iOS) Integratsiyasi](#7-mijoz-dasturlari-web-android-ios-integratsiyasi)

---

## 1. Arxitektura Umumiy Ko'rinishi

WZone chat tizimi **Dual-Transport** (WebSocket + HTTP REST Fallback) arxitekturasida qurilgan:

```
┌────────────────────────────────────────────────────────┐
│              Mijoz (Web / Mobile App)                  │
└────────────┬─────────────────────────────▲─────────────┘
             │ 1. WebSocket                │ 2. HTTP REST Fallback
             │    (Real-time bi-dir)       │    (POST / GET)
             ▼                             │
┌──────────────────────────────────────────┴─────────────┐
│                 Go Gin Backend                         │
│  ┌───────────────────┐    ┌─────────────────────────┐  │
│  │   ChatHub (WS)    │◄───┤  REST Handlers          │  │
│  │   - register      │    │  - ListChatMessages     │  │
│  │   - unregister    │    │  - SendChatMessage      │  │
│  │   - broadcast     │    │  - ListChatRooms        │  │
│  └─────────┬─────────┘    └────────────┬────────────┘  │
└────────────┼───────────────────────────┼───────────────┘
             ▼                           ▼
┌────────────────────────────────────────────────────────┐
│            PostgreSQL (chat_messages)                  │
└────────────────────────────────────────────────────────┘
```

### Asosiy Tamoyillar:
- **Zero-Drop Kafolati**: WebSocket uzilgan holatda ham xabarlar HTTP REST `POST /api/v1/chat/messages` orqali muvaffaqiyatli jo'natiladi va bazaga yoziladi.
- **Tezkor Yuklash (Instant Render)**: Xonaga kirganda avval REST API orqali so'nggi xabarlar darhol ekranga chiqariladi, so'ngra WebSocket oqimi jonlantiriladi.
- **Mehmon va Ro'yxatdan O'tgan Foydalanuvchilar**: Tizim mehmon foydalanuvchilarga ham (guest ID bilan) va ro'yxatdan o'tgan foydalanuvchilarga ham (OneID / Email) xabar yozish imkonini beradi.

---

## 2. Ma'lumotlar Bazasi Modeli (Database Schema)

`chat_messages` jadvali quyidagi strukturaga ega:

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable (mehmonlar uchun)
    sender_name VARCHAR(255) NOT NULL DEFAULT 'WZone Foydalanuvchisi',
    sender_avatar TEXT DEFAULT '',
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tezkor saralash va qidirish uchun indekslar:
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON chat_messages(room_id, created_at ASC);
```

### Maydonlar Tavsifi:
| Maydon | Turi | Tavsif |
| :--- | :--- | :--- |
| `id` | `UUID` | Xabarning yagona identifikatori (UUID v4) |
| `room_id` | `VARCHAR(255)` | Xona yoki kanal IDsi (`general`, `dm_user1_user2`) |
| `user_id` | `UUID` (Nullable) | Yuboruvchining tizimdagi IDsi; mehmon bo'lsa `NULL` |
| `sender_name` | `VARCHAR(255)` | Yuboruvchining to'liq ismi (F.I.O) |
| `sender_avatar`| `TEXT` | Profil rasmining URL manzili |
| `content` | `TEXT` | Xabar matni |
| `created_at` | `TIMESTAMPTZ` | Yuborilgan vaqt (UTC) |

---

## 3. WebSocket Protokoli va Ulanish

### Ulanish URL formati:
```
ws://<HOST>/api/v1/ws?room=<ROOM_ID>&user_id=<USER_ID>&user_name=<USER_NAME>&avatar=<AVATAR_URL>
```
*(HTTPS muhitda `wss://` ishlatiladi)*

### Parametrlar:
- `room`: Kanal yoki shaxsiy xona IDsi (masalan: `general`, `ish-qidiruvchilar`)
- `user_id`: Foydalanuvchi IDsi yoki `guest`
- `user_name`: Foydalanuvchi ismi (URL-encoded)
- `avatar`: Foydalanuvchi avatar rasmi URLi (URL-encoded)

### Kiruvchi va Chiquvchi Freymlar:

#### 1. Tarix freymi (Ulanganda serverdan mijozga):
```json
{
  "type": "history",
  "room_id": "general",
  "data": [
    {
      "id": "c1f7a0be-...",
      "room_id": "general",
      "user_id": "8e9d...",
      "sender_name": "Sardor Rahimov",
      "sender_avatar": "/uploads/avatars/user.jpg",
      "content": "Salom, hammaga ishlar qalay?",
      "created_at": "2026-09-28T12:00:00Z"
    }
  ]
}
```

#### 2. Xabar yuborish (Mijozdan serverga):
```json
{
  "room_id": "general",
  "content": "Backend dasturchi vakansiyasi bo'yicha savolim bor edi",
  "sender_name": "Azizbek",
  "sender_avatar": ""
}
```

#### 3. Real-vaqtli yangi xabar (Serverdan barcha xonadagilarga):
```json
{
  "type": "message",
  "id": "d2a8b9ef-...",
  "room_id": "general",
  "user_id": "8e9d...",
  "sender_name": "Azizbek",
  "sender_avatar": "",
  "content": "Backend dasturchi vakansiyasi bo'yicha savolim bor edi",
  "created_at": "2026-09-28T12:01:15Z"
}
```

#### 4. Heartbeat (Ping/Pong):
- Mijoz har 25-30 soniyada `{ "type": "ping" }` jo'natadi.
- Server `{ "type": "pong" }` qaytaradi. Bu orqali aloqa uzilishi oldi olinadi.

---

## 4. REST API Endpoints (Fallback & Management)

### 1. `GET /api/v1/chat/rooms`
Barcha faol umumiy kanallar ro'yxati.
- **Javob**:
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "general",
        "name": "Umumiy IT Muloqot",
        "description": "Barcha IT mutaxassislar va qidiruvchilar uchun ochiq suhbat",
        "icon": "hash"
      }
    ]
  }
}
```

### 2. `GET /api/v1/chat/messages?room=:room_id`
Berilgan xonadagi so'nggi xabarlar tarixini yuklash (oxirgi 100 ta xabar).
- **Javob**:
```json
{
  "success": true,
  "data": {
    "room_id": "general",
    "messages": [ ... ]
  }
}
```

### 3. `POST /api/v1/chat/messages`
Xabar yuborish (WebSocket uzilgan holatda yoki REST orqali yuborishda).
- **Request Body**:
```json
{
  "room_id": "general",
  "content": "Assalomu alaykum!",
  "sender_name": "Yusuf",
  "sender_avatar": ""
}
```
- **Javob**:
```json
{
  "success": true,
  "data": {
    "message": {
      "id": "...",
      "room_id": "general",
      "content": "Assalomu alaykum!",
      "created_at": "..."
    }
  }
}
```

### 4. `GET /api/v1/chat/health`
Chat tizimining jonli holati, faol xonalar va ulangan foydalanuvchilar soni.

---

## 5. Xonalar (Rooms) va Shaxsiy Xabarlar (DM)

1. **Umumiy Kanallar**:
   - `general`: Umumiy IT Muloqot
   - `ish-qidiruvchilar`: Nomzodlar & Dasturchilar
   - `ish-beruvchilar`: Ish beruvchilar & HR
   - `savol-javob`: Savol-Javob & Intervyu

2. **1-ga-1 Shaxsiy Xabarlar (Direct Messages)**:
   - Shaxsiy xona IDsi har doim ikkala foydalanuvchining IDlarini alifbo bo'yicha tartiblash orqali aniqlanadi:
   ```ts
   const roomId = `dm_${[userA_id, userB_id].sort().join('_')}`;
   ```
   - Masalan: `dm_8e9d1a_b2c3d4`. Bu har ikkala foydalanuvchi bir xil xonaga ulanishini ta'minlaydi.

---

## 6. Xatoliklar va Ularni Qayta Ishlash (Resilience & Fallback)

1. **Port va Manzil Xatoligi (Host Mismatch)**:
   - Web ilova `localhost:3000` da, Go backend esa `localhost:8080` da ishlaganda, WebSocket to'g'ri backend portiga ulanishi shart.
2. **Aloqa Uzilishi (Disconnect)**:
   - WebSocket uzilganda avtomatik qayta ulanish (Exponential Backoff: 1s, 2s, 4s, 8s max).
3. **Dual Send**:
   - Xabar yozilganda, agar WebSocket holati `OPEN` bo'lmasa, xabar avtomatik ravishda `api.sendChatMessage` (HTTP POST) orqali yuboriladi va chat oynasida darhol aks ettiriladi.
4. **Baza cheklovlari (NOT NULL constraint)**:
   - Mehmon foydalanuvchilar uchun `user_id` ustuni `NULL` bo'lishi mumkin qilingan, bu orqali ro'yxatdan o'tmaganlar ham muloqotda ishtirok eta oladi.

---

## 7. Mijoz Dasturlari Integratsiyasi

Web interfeysida:
- [`FullChatView.tsx`](file:///home/yusuf/workhub/web/components/FullChatView.tsx) — To'liq ekranli muloqot portali
- [`ChatModal.tsx`](file:///home/yusuf/workhub/web/components/ChatModal.tsx) — Nomzod yoki vakansiya egasi bilan tezkor 1-ga-1 suhbat modal oynasi
- [`api.ts`](file:///home/yusuf/workhub/web/lib/api.ts) — Chat uchun barcha REST va WebSocket yordamchi funksiyalari
