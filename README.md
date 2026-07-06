# PIXEL

**PIXEL** is a premium, cyber-neon developer portfolio and modular online-tools hub, built with Node.js + Express and designed for one-click deployment on Netlify.

Created by **LIKHON AHMED** (nickname: **আতঙ্ক**).

---

## ✨ Features

- Black background, blue-neon, glassmorphism UI with animated particle background
- Hero section with typing effect, glowing buttons, and glass cards
- Top navbar + three-dot (⋮) menu: Settings, Tools, About Developer, Future Updates
- **Modular Tools system** — drop a new folder into `src/tools/`, run a build, and it appears in the Tools menu automatically. No other code changes required.
- First tool included: **ImgBB Image Upload** — drag & drop, multi-upload, progress bars, previews, and copy buttons for URL / Delete URL / BBCode / HTML / Markdown. The ImgBB secret key stays server-side and is never exposed to the browser.
- Centralized profile config (`src/config/profile.js`) — every page reads name, nickname, phone, and Telegram from this one file.
- Security & performance middleware: Helmet, compression, CORS, rate limiting, Morgan logging.
- Custom cursor, scroll-to-top button, scroll-reveal animations, loading screen, custom 404 page.
- Runs identically in local dev (Express server) and on Netlify (the same Express app wrapped as a serverless function).

---

## 📁 Folder Structure

```
pixel/
├── netlify/
│   └── functions/
│       └── api.js            # Wraps the Express app for Netlify Functions
├── netlify.toml               # Netlify build + redirect config
├── package.json
├── .env.example
├── public/                    # Static site (Netlify publish directory)
│   ├── index.html             # Main single-page site
│   ├── main.js                 # Front-end logic (fetches /api/* for data)
│   ├── 404.html
│   ├── tools/                  # AUTO-GENERATED copy of src/tools (build output)
│   └── tools-manifest.json     # AUTO-GENERATED tools list (build output)
├── scripts/
│   └── generate-tools-manifest.js   # Scans src/tools → builds manifest + public/tools
├── server/
│   ├── index.js                # Express app (used both locally and by Netlify)
│   └── routes/
│       ├── dataRouter.js       # /api/profile, /api/tools, /api/projects
│       └── toolsRouter.js      # Auto-mounts each tool's api.js at /api/tools/<slug>
├── src/
│   ├── assets/img/             # Images (logo, etc.)
│   ├── components/             # (reserved for future shared UI partials)
│   ├── config/
│   │   ├── profile.js          # ⭐ All personal info lives here
│   │   └── projects.json       # Projects shown on the homepage
│   ├── pages/                  # (reserved for future multi-page expansion)
│   ├── styles/
│   │   ├── global.css          # Design tokens, glass/neon utilities
│   │   └── home.css            # Navbar, hero, sections, footer, extras
│   ├── tools/
│   │   └── imgbb-upload/       # Reference tool — copy this folder to add new tools
│   │       ├── config.json     # Metadata (name, description, icon, order)
│   │       ├── index.html
│   │       ├── style.css
│   │       ├── script.js
│   │       └── api.js          # Server-only route (never copied to /public)
│   └── utils/                  # (reserved for shared helper functions)
└── database/                   # Reserved for future persistence (none required yet)
```

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

`npm install` automatically runs the build script once (via `postinstall`), which generates `public/tools-manifest.json` and copies each tool's static files into `public/tools/`.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

```
PORT=3000
NODE_ENV=development
IMGBB_API_KEY=your_imgbb_api_key_here
```

Get a free ImgBB API key at **https://api.imgbb.com/**.

### 3. Run locally

```bash
npm run dev
```

Visit **http://localhost:3000**.

### 4. Production start (without nodemon)

```bash
npm run build
npm start
```

---

## 🧰 Adding a New Tool (no core code changes needed)

1. Create a new folder: `src/tools/<your-tool-slug>/`
2. Add these files inside it:
   - `config.json` — metadata:
     ```json
     {
       "name": "My New Tool",
       "description": "One-line description shown on the Tools card.",
       "icon": "wrench",
       "order": 2,
       "enabled": true
     }
     ```
   - `index.html`, `style.css`, `script.js` — the tool's UI (see `src/tools/imgbb-upload` as the reference implementation)
   - `api.js` *(optional)* — an Express `Router` for any backend endpoints the tool needs. It is auto-mounted at `/api/tools/<your-tool-slug>/...` and is **never** copied into the public bundle, so secrets stay server-side.
3. Run `npm run build` (this happens automatically on every Netlify deploy).
4. The tool now appears automatically in:
   - The **Tools** section on the homepage
   - The **⋮ → Tools** menu item

No edits to `server/index.js`, `public/main.js`, or any other core file are required.

---

## 🔐 Environment Variables

| Variable        | Required | Description                                   |
|-----------------|----------|------------------------------------------------|
| `PORT`          | No       | Local dev server port (default `3000`)         |
| `NODE_ENV`      | No       | `development` or `production`                   |
| `IMGBB_API_KEY` | Yes      | Secret key for the ImgBB Upload tool's backend  |

Secrets are read only on the server (`src/tools/imgbb-upload/api.js`) via `process.env`. They are never sent to, or embedded in, any file served to the browser.

---

## ☁️ Deploying to Netlify

1. Push this project to a Git repository (GitHub/GitLab/Bitbucket).
2. In Netlify: **Add new site → Import an existing project**, and select the repo.
3. Build settings (already defined in `netlify.toml`, no changes needed):
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`
4. Add environment variables in **Site settings → Environment variables**:
   - `IMGBB_API_KEY = <your key>`
5. Deploy. `netlify.toml` already redirects `/api/*` to the serverless function, so the ImgBB tool and any future tool backends work with zero extra config.

### Netlify CLI (optional, for local testing of functions)

```bash
npm install -g netlify-cli
netlify dev
```

---

## 🎨 Customization

- **Personal info** — edit `src/config/profile.js` only. Every page reads from it.
- **Projects list** — edit `src/config/projects.json`.
- **Logo** — replace `src/assets/img/logo.svg` with your own image (keep the same filename, or update the `logo` path in `profile.js`). A placeholder neon "P" mark is included; swap it out with your uploaded logo image.
- **Colors / theme** — all design tokens (colors, radii, easing) are CSS variables at the top of `src/styles/global.css`.
- **Fonts** — Chakra Petch (display/headings), Inter (body/UI), Noto Sans Bengali (nickname/Bengali text), loaded via Google Fonts in `public/index.html`.

---

## 🧪 Code Quality Notes

- Clean, commented, modular code — no placeholder or dead code.
- Tool backend code (`api.js`) is deliberately excluded from the static `public/` bundle by the build script, so secrets can never leak client-side.
- Rate limiting, Helmet security headers, and compression are enabled by default in `server/index.js`.
- Reduced-motion is respected both automatically (`prefers-reduced-motion`) and via a manual toggle in **⋮ → Settings**.

---

## 📄 License

MIT — see `LICENSE`.

---

Built with ❤️ by **LIKHON AHMED** (আতঙ্ক) · Telegram: [@rx_rihad](https://t.me/rx_rihad)
