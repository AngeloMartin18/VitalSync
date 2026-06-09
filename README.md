# 🏋️ VitalSync

A minimalist fitness and nutrition tracker built with Next.js 15. Log meals, scan barcodes, track macros, and build weekly diet & exercise plans — all stored locally in a SQLite database.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js) ![React](https://img.shields.io/badge/React-19-blue?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript) ![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-green?logo=sqlite)

---

## ✨ Features

- 📊 **Dashboard** — Daily calorie and macro summary with progress bars
- 🍽️ **Meal logging** — Search foods by name with real-time results
- 📷 **Barcode scanning** — Use your camera to scan product barcodes
- 📅 **Weekly planner** — Build a 7-day diet and exercise plan with lifestyle presets
- 🎯 **Nutrition goals** — Set custom calorie and macro targets
- 🎮 **Demo mode** — Works out of the box without any API keys (uses built-in food data)
- 💾 **Local-first** — All data stored in a local SQLite file, no account required

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Database | better-sqlite3 (local SQLite) |
| Barcode scanning | @zxing/library |
| Nutrition data | Nutritionix API (optional) |
| Language | TypeScript 5 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** (comes with Node.js)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/vitalsync.git
cd vitalsync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables (optional)

VitalSync runs in **demo mode** by default with a built-in food database. To enable live food search and barcode lookup, add your [Nutritionix API](https://developer.nutritionix.com/) credentials:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```env
NUTRITIONIX_APP_ID=your_app_id_here
NUTRITIONIX_APP_KEY=your_app_key_here
```

> 💡 **Free tier:** Nutritionix offers a free API key at [developer.nutritionix.com](https://developer.nutritionix.com/). Without a key, VitalSync uses demo data — all other features work normally.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | 🔧 Start development server with hot reload |
| `npm run build` | 📦 Build for production |
| `npm run start` | ▶️ Start production server (after build) |
| `npm run lint` | 🔍 Run ESLint |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── demo/        # Demo mode status endpoint
│   │   ├── food/
│   │   │   ├── search/  # Food search API
│   │   │   └── barcode/ # Barcode lookup API
│   │   ├── meals/       # Meal CRUD API
│   │   └── plan/        # Weekly plan & goals API
│   ├── plan/            # Weekly planner page
│   ├── track/           # Meal tracking page
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Dashboard (home)
├── components/
│   ├── DemoBanner.tsx   # Demo mode indicator
│   └── Navbar.tsx       # Navigation bar
└── lib/
    ├── db.ts            # SQLite database layer
    └── nutritionix.ts   # Nutritionix API client
```

---

## 🗄️ Database

VitalSync creates a `vitalsync.db` SQLite file in the project root on first run. No setup required — the schema is initialized automatically.

Three tables are used:

- 🍴 `meals` — logged food entries with full nutritional data
- 🎯 `daily_goals` — calorie and macro targets
- 📅 `weekly_plans` — saved diet and exercise plans (stored as JSON)

---

## 🌐 Deployment

### Self-hosted / VPS

```bash
npm run build
npm run start
```

The server runs on port 3000 by default. Use a reverse proxy (nginx, Caddy) to expose it.

> ⚠️ **Note:** The SQLite database is written to the local filesystem. Serverless platforms (Vercel, Netlify) are not compatible with `better-sqlite3` — use a VPS or a container-based host instead.

### 🐳 Docker (example)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT
