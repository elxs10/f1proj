# 🏎️ F1 2026 — Live Telemetry & Race Tracker

A full-stack Formula 1 companion app for the 2026 season. Built with a Node.js microservices backend and a React Native Android app — featuring live race standings, driver telemetry, circuit maps, and full season history powered by the [OpenF1 API](https://openf1.org).

---

## 📱 Screenshots

> Standings · Telemetry · Calendar · Live Race · Track Map

---

## 🧱 Architecture

```
f1proj/
├── services/
│   ├── api-gateway/        # Express REST API (port 3000)
│   └── data-fetcher/       # Background polling service
├── F1App/                  # React Native app (Android)
└── docker-compose.yml      # 4-container stack
```

### Backend Stack
| Service | Tech |
|---|---|
| API Gateway | Node.js + Express |
| Data Fetcher | Node.js (polling) |
| Cache | Redis |
| Database | PostgreSQL |
| Containerisation | Docker Compose |

### Frontend Stack
| Tech | Version |
|---|---|
| React Native | 0.84.1 |
| TypeScript | ✅ |
| Navigation | React Navigation v7 |
| Charts | react-native-svg |
| Animations | react-native-reanimated |

---

## 🚀 Getting Started

### Prerequisites
- Docker + Docker Compose
- Node.js 18+
- Android Studio (for emulator) or Android device

### 1. Clone the repo
```bash
git clone https://github.com/elxs10/f1proj.git
cd f1proj
```

### 2. Start the backend
```bash
docker compose up -d
```

This starts 4 containers:
- `f1_api_gateway` → REST API on port 3000
- `f1_data_fetcher` → background polling
- `f1_redis` → caching layer
- `f1_postgres` → persistent storage

### 3. Run the app (emulator)
```bash
cd F1App
npm install
npx react-native run-android
```

### 4. Run on physical device
Update the base URL in `F1App/src/api/index.ts`:
```ts
const BASE_URL = 'http://YOUR_MAC_IP:3000';
```
Or use ngrok:
```bash
brew install ngrok
ngrok http 3000
# paste the ngrok URL into BASE_URL
```

---

## 📡 API Routes

| Route | Description |
|---|---|
| `GET /api/standings?session=` | Race/qualifying standings |
| `GET /api/drivers?session=` | Driver info + headshots |
| `GET /api/telemetry?driver=&session=` | Speed, RPM, gear, throttle, brake |
| `GET /api/calendar?year=` | Full season calendar + sessions |
| `GET /api/history?year=` | Race results history |
| `GET /api/track?session=` | SVG circuit outline + sector data |
| `GET /api/live?session=` | Live positions, gaps, tyre info |

All routes use Redis + Postgres caching. Live data caches for 10 seconds, circuit data for 7 days.

---

## 📲 App Screens

### Standings Tab
- **StandingsScreen** — 2026 championship standings with driver headshots
- **TelemetryScreen** — SVG line graphs for Speed, RPM, Throttle with AVG/PEAK labels. Live AERO/BRAKE status pills.

### Calendar Tab
- **CalendarScreen** — Full 2026 season (26 rounds). Tap FP1/FP2/FP3/Quali/Race session pills.
- **TrackInfoScreen** — SVG circuit outline with sector colours (S1 red · S2 blue · S3 yellow) + session results
- **LiveTrackScreen** — Live circuit map with race order and tyre compounds

### History Tab
- **HistoryScreen** — 2026 race list
- **RaceBreakdownScreen** — Full race results, fastest lap, tyre stints

### Live Tab
- **LiveRaceScreen** — Auto-refreshes every 15 seconds. Shows position, driver, team, tyre compound + age, gap to leader, interval. Tap driver → Telemetry.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Background | `#080808` |
| Surface | `#111111` |
| Red (F1) | `#e8002d` |
| Green | `#00d2be` |
| Yellow | `#ffd700` |
| Orange | `#ff8700` |

**Fonts:** Rajdhani Bold (headers) · JetBrains Mono (labels/mono) · Inter (body)

---

## 🔑 2026 Session Keys (Australian GP)

| Session | Key |
|---|---|
| Practice 1 | 11227 |
| Practice 2 | 11228 |
| Practice 3 | 11229 |
| Qualifying | 11230 |
| Race | 11234 |

---

## ⚠️ Known Limitations

- **Live data (OpenF1)** requires a paid API key (€9.90/month) during active race sessions. Historical data is free when no live session is running.
- **GPS car dots** on track map not yet available — OpenF1 has not released 2026 location data.
- **Team radio** tab deferred — no data available from OpenF1 for 2026 yet.

---

## 🛠️ Useful Commands

```bash
# Restart backend
docker compose up -d

# Rebuild api-gateway after changes
docker compose up --build api-gateway -d

# Clear all cache
docker exec f1_redis redis-cli FLUSHALL

# Clear specific cache
docker exec f1_redis redis-cli DEL "calendar:2026"
docker exec f1_postgres psql -U kunju -d f1_app -c "DELETE FROM calendar WHERE year=2026;"

# Build release APK
cd F1App/android
./gradlew assembleRelease
# APK → F1App/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📦 Data Source

All F1 data is sourced from [OpenF1](https://openf1.org) — an open, free Formula 1 API providing real-time and historical data including telemetry, positions, stints, laps, and more.

---


