# PixelMind AI — Image Generation Web App

<div align="center">
  <h3>✦ PixelMind AI</h3>
  <p>A stunning, multi-page frontend for an AI Image Generation web app built with pure HTML, CSS & JavaScript.</p>
  <br/>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" />
</div>

---

## 🌟 Features

- 🎨 **AI Image Generation** — Generate stunning images from text prompts
- 🔐 **Auth System** — Signup, Login, Logout with localStorage persistence
- ⚡ **Usage Limits** — Free users get 5 image generations; limit-reached modal on cap
- 🛡️ **Protected Routes** — Query page is inaccessible without login
- 💎 **Premium UI** — Dark glassmorphism design with animated blobs and gradients
- 📱 **Fully Responsive** — Works beautifully on mobile, tablet, and desktop
- 🔔 **Toast Notifications** — Real-time feedback for all user actions

---

## 📄 Pages

| Page | File | Description |
|---|---|---|
| 🏠 Home / Landing | `index.html` | Marketing page with hero, features, pricing |
| 🔐 Login | `login.html` | Auth form with validation & password toggle |
| 📝 Signup | `signup.html` | Registration with password strength meter |
| 🎨 Query (Generate) | `query.html` | **Protected** image generation page |

---

## 📁 Project Structure

```
ImageGenAI/
├── index.html              ← Landing / Home page
├── login.html              ← Login page
├── signup.html             ← Signup page
├── query.html              ← Image generation (protected)
├── assets/
│   ├── css/
│   │   └── style.css       ← Global design system & components
│   └── js/
│       ├── auth.js         ← Auth helpers (login/signup/logout/guards)
│       ├── limits.js       ← Usage limit tracker (5 free images)
│       └── query.js        ← Generation logic, gallery, modals
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Run locally

No build step required. Just open the app in your browser:

```bash
# Option 1: Open directly
start index.html

# Option 2: Serve with VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 3: Use Python simple server
python -m http.server 3000
# Then open http://localhost:3000
```

### Auth Flow

1. Go to **Signup** → create an account (stored in `localStorage`)
2. Go to **Login** → sign in
3. You're redirected to **Query** — the protected page
4. Generate up to **5 images** on the free plan
5. After 5 images, a **"LIMIT REACHED"** modal appears

> ⚠️ Since this is a frontend-only demo, auth uses `localStorage`. Replace with a real backend (e.g., Cloudflare Workers + D1) before production.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Font | `Outfit` (Google Fonts) |
| Background | `#050510` (deep space) |
| Primary gradient | `#7c3aed → #a855f7 → #ec4899` |
| Glass surface | `rgba(255,255,255,0.04)` |
| Border | `rgba(255,255,255,0.08)` |

---

## ☁️ Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link & deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy to Cloudflare Pages

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy (Cloudflare Pages)
wrangler pages deploy . --project-name pixelmind-ai
```

---

## 🔮 Roadmap

- [ ] Connect real AI model API (Cloudflare Workers AI / Stability AI / Replicate)
- [ ] Backend auth with JWT (Cloudflare Workers + D1 database)
- [ ] Subscription management (Stripe integration)
- [ ] Image history stored in Cloudflare R2
- [ ] Social sharing feature
- [ ] Image style presets

---

## 📜 License

MIT © 2026 PixelMind AI
