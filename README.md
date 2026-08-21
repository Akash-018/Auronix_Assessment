# PixelTest — Live Screenshot-Based HTML/CSS Workspace

PixelTest is a lightweight, browser-based frontend coding workspace where an administrator uploads a reference design screenshot, writes HTML/CSS/JS, and views real-time rendered results in a sandboxed iframe.

## Key Features
- **Admin Authentication**: JWT-based auth with secure password hashing and protected routes.
- **Challenge Creation**: Fast screenshot uploading with automatic width, height, and aspect ratio detection.
- **VS Code Style Workspace**: 3-panel resizable layout (Reference Image | Monaco Editor | Live Sandboxed Preview).
- **Monaco Editor Integration**: Full syntax highlighting, line numbers, and autocomplete for HTML, CSS, and JS.
- **Sandboxed Live Preview**: Client-side execution in a isolated iframe with console error capturing.
- **Viewport Controls**: Presets (Desktop, Tablet, Mobile) and "Match Reference" button to match target dimensions.
- **Autosave & Local Recovery**: 5-second debounced background autosave with offline localStorage fallback.

---

## Quick Start (Development)

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL database running on `localhost:5432`

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

Default Admin Credentials: `admin@pixeltest.com` / `AdminPassword123!`

---

## Docker Setup (Single Container)
```bash
docker-compose up --build
```
Access the full-stack web service at `http://localhost:8000`.
