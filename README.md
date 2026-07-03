# Studio — Web Design / Videography / Video Editing site

A complete, working freelance services site:

- **Public site** (`frontend/index.html`) — hero, services, portfolio grid, about, and a contact form that saves leads to your backend.
- **Admin dashboard** (`frontend/admin.html`) — password-protected page to view/manage leads and add/delete portfolio items.
- **Backend** (`backend/`) — Node.js + Express API. Stores data in a simple JSON file (`backend/data.json`), auto-created on first run. No external database to install.

No build step, no framework tooling — just Node.js.

---

## 1. What you need installed

- **Node.js** (v18 or newer). Check with:
  ```
  node -v
  ```
  If you don't have it, download from https://nodejs.org (LTS version).

That's the only requirement.

---

## 2. Setup (one time)

Open a terminal in the `backend` folder:

```bash
cd backend
npm install
cp .env.example .env
```

Now open `.env` in a text editor and change these two values:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-own-strong-password
JWT_SECRET=any-long-random-string-you-make-up
```

This is your login for the `/admin.html` dashboard — set a real password, don't leave the default.

---

## 3. Run it

```bash
npm start
```

You'll see:
```
Server running at http://localhost:3000
Admin dashboard at http://localhost:3000/admin.html
```

- Public site: **http://localhost:3000**
- Admin dashboard: **http://localhost:3000/admin.html** (log in with the username/password you set in `.env`)

Leave this terminal running while you use the site. Press `Ctrl+C` to stop it.

---

## 4. How to use it day-to-day

**Adding portfolio work:** Go to `/admin.html` → log in → "Portfolio" tab → fill in title, category (e.g. "Web Design", "Videography", "Video Editing"), an image URL (upload your image anywhere — e.g. Imgur, your own hosting — and paste the link), and an optional link to the live project. It appears on the public site instantly, filterable by category.

**Managing leads:** When someone fills out the contact form, it shows up in the "Leads" tab with their name, email, phone, service, budget, and message. Update the status dropdown (`new` → `contacted` → `won`/`lost`) to track your pipeline. Delete leads you no longer need.

**Editing the copy/design:** All page text lives directly in `frontend/index.html`. Colors and fonts are defined as CSS variables at the top of `frontend/css/style.css` (the `:root` block) — change those to re-theme the whole site.

---

## 5. Putting it on the internet (so clients can actually reach it)

Right now it only runs on your own computer (`localhost`). To make it public, deploy the `backend` folder (which also serves the `frontend` folder) to a host that runs Node.js. Good beginner-friendly options:

- **Render.com** — free tier, connects to a GitHub repo, auto-deploys on push.
- **Railway.app** — similar, very quick to set up.
- **A VPS** (e.g. DigitalOcean, Hetzner) if you want full control — run `npm start` behind a process manager like `pm2`, and put it behind a domain with HTTPS (e.g. via Caddy or Nginx + Let's Encrypt).

Whichever you choose, set the same environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `PORT`) in that platform's dashboard instead of a local `.env` file — most hosts have a place for this.

**Important:** the JSON data file (`backend/data.json`) lives on that server's disk. Some free hosting tiers wipe the disk on redeploy — if that matters to you, ask and I can swap this for a proper hosted database (e.g. free-tier Postgres) once you've picked a host.

---

## 6. Project structure

```
creator-services/
├── backend/
│   ├── server.js        ← Express app + all API routes
│   ├── db.js             ← simple JSON-file data layer (leads + portfolio)
│   ├── package.json
│   ├── .env.example      ← copy to .env and fill in your own values
│   └── data.json          ← created automatically on first run (your data)
└── frontend/
    ├── index.html         ← public site
    ├── admin.html          ← admin dashboard
    ├── css/style.css
    └── js/
        ├── main.js         ← public site behavior (form, portfolio, nav)
        └── admin.js         ← dashboard behavior (login, leads, portfolio CRUD)
```

## 7. API reference (for reference / future extension)

| Method | Route                     | Auth | Purpose                        |
|--------|----------------------------|------|---------------------------------|
| POST   | `/api/leads`               | no   | Submit a contact form lead     |
| GET    | `/api/portfolio`           | no   | List portfolio items           |
| POST   | `/api/admin/login`         | no   | Log in, returns a token        |
| GET    | `/api/admin/leads`         | yes  | List all leads                 |
| PATCH  | `/api/admin/leads/:id`     | yes  | Update a lead's status         |
| DELETE | `/api/admin/leads/:id`     | yes  | Delete a lead                  |
| POST   | `/api/admin/portfolio`     | yes  | Add a portfolio item           |
| PUT    | `/api/admin/portfolio/:id` | yes  | Edit a portfolio item          |
| DELETE | `/api/admin/portfolio/:id` | yes  | Delete a portfolio item        |

"Auth" routes need an `Authorization: Bearer <token>` header, where the token comes from `/api/admin/login`.
