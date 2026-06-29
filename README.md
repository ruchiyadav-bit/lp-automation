# LandingPageSaaS

A full-stack SaaS starter for building and managing landing pages, compliance widgets, and email templates.

**Stack:** React 18 + Tailwind CSS · Node.js + Express · MySQL

---

## Folder Structure

```
LandingPageSaaS/
├── frontend/                   # React + Tailwind client
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── CookieBanner.jsx
│   │   │   └── AgeVerificationModal.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Templates.jsx
│   │   ├── utils/
│   │   │   └── api.js          # Axios instance + JWT interceptors
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css           # Tailwind directives + custom components
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   └── package.json
│
├── backend/                    # Express + MySQL API
│   ├── config/
│   │   ├── db.js               # MySQL connection pool
│   │   └── jwt.js              # Sign/verify helpers
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── template.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT guard
│   │   └── validate.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── template.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   └── email.service.js    # Nodemailer + template rendering
│   ├── database/
│   │   └── schema.sql          # CREATE TABLE statements
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── package.json
│
├── templates/                  # Standalone HTML templates
│   ├── cookie/
│   │   └── cookie-banner.html
│   ├── age-verification/
│   │   └── age-gate.html
│   └── email/
│       ├── welcome.html
│       ├── password-reset.html
│       └── notification.html
│
└── README.md
```

---

## Quick Start

> **No database server needed.** The backend uses an embedded **SQLite** database
> that creates itself on first run (`backend/data/app.db`) and seeds an admin
> login automatically. No MySQL / XAMPP required.

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd LandingPageSaaS

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

> `npm install` in `backend/` builds `better-sqlite3`, which ships prebuilt
> binaries for **Node 20+**. If install fails on an older Node, upgrade to Node 20+.

### 2. Configure environment (optional)

Everything runs out of the box. Only add a `.env` if you want AI generation,
real stock images, or email:

```bash
cd backend
cp .env.example .env
```

| Variable | Needed for |
|----------|-----------|
| `OPENAI_API_KEY` | AI copy + blog generation (otherwise sensible offline fallbacks are used) |
| `PEXELS_API_KEY` | Real stock photos for the desktop landing page (otherwise a keyless image source) |
| `SMTP_*` | Sending emails |
| `JWT_SECRET` | Set your own for production |

> The frontend needs no config unless the backend runs on a non-default port
> (`REACT_APP_API_URL` in `frontend/.env`).

### 3. Run in development

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:3000)
cd frontend && npm start
```

On Windows you can also just double-click **`start.bat`** in the project root to
launch both at once.

### 4. Log in

A default admin account is seeded on first run:



You can override these with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `backend/.env`.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/forgot-password` | — | Send reset email |
| POST | `/api/auth/reset-password/:token` | — | Reset password |
| GET | `/api/users/me` | JWT | Get own profile |
| PUT | `/api/users/me` | JWT | Update profile |
| DELETE | `/api/users/me` | JWT | Delete account |
| GET | `/api/templates` | JWT | List own templates |
| GET | `/api/templates/:id` | JWT | Get single template |
| POST | `/api/templates` | JWT | Create template |
| PUT | `/api/templates/:id` | JWT | Update template |
| DELETE | `/api/templates/:id` | JWT | Delete template |

---

## Templates

### Cookie Banner (`templates/cookie/cookie-banner.html`)
Drop-in GDPR/CCPA cookie consent banner with Accept / Decline / Settings actions.

### Age Gate (`templates/age-verification/age-gate.html`)
Full-page age verification wall. Redirects underage visitors away and stores session verification.

### Email Templates (`templates/email/`)
| File | Use |
|------|-----|
| `welcome.html` | Sent on registration. Variables: `{{name}}`, `{{dashboard_url}}` |
| `password-reset.html` | Sent on forgot-password. Variables: `{{email}}`, `{{reset_url}}` |
| `notification.html` | Generic notification. Variables: `{{heading}}`, `{{body}}`, `{{cta_url}}`, `{{cta_label}}` |

The backend `email.service.js` replaces `{{variable}}` placeholders automatically.

---

## Environment Variables

### Backend (`backend/.env`)

All variables are **optional** — the app runs without a `.env`.

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 5000) |
| `DB_FILE` | SQLite file path (default `backend/data/app.db`) |
| `JWT_SECRET` | Secret for signing tokens — set your own for production |
| `JWT_EXPIRES_IN` | Token TTL (e.g. `7d`) |
| `OPENAI_API_KEY` | AI copy + blog generation (falls back to offline content if unset) |
| `PEXELS_API_KEY` | Real stock images for landing pages (keyless source used if unset) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email SMTP config |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Override the seeded admin login |
| `CLIENT_URL` | Frontend origin for CORS |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend base URL (default `http://localhost:5000`) |

---

## Production Build

```bash
cd frontend && npm run build
```

Serve the `frontend/build` folder with Nginx, Caddy, or any static host. Point the API proxy to your backend.

---

## License

MIT
