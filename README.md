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
- **SQL Assessment Track**: 5 seeded challenges (Beginner → Expert) with a live in-browser SQLite sandbox, schema browser, and result grid.

---

## Test Categories

| Category | Candidate workspace | Starter code |
|----------|--------------------|--------------|
| `HTML` | Reference screenshot · HTML/CSS/JS editor · live iframe preview | Boilerplate template |
| `JS`   | Editor focused on the JS tab · live iframe preview | Admin-defined method stub |
| `SQL`  | Question brief + schema browser · SQL editor · live query result grid | **None — deliberately blank** |

### SQL track

Five challenges are seeded automatically on server startup (idempotent, matched by title):

| # | Challenge | Level | Focus |
|---|-----------|-------|-------|
| 1 | Employee Directory — Filtering & Sorting | Beginner | `WHERE`, multi-key `ORDER BY`, `LIMIT` |
| 2 | Store Sales — Grouping & Aggregation | Beginner+ | `GROUP BY`, `HAVING`, aggregates |
| 3 | Customer Orders — Multi-Table Joins | Intermediate | `LEFT JOIN`, `COUNT(DISTINCT)`, `COALESCE` |
| 4 | Departmental Pay Bands — Window Functions | Advanced | `DENSE_RANK`, `PARTITION BY`, CTEs |
| 5 | Org Chart Traversal — Recursive CTEs | Expert | `WITH RECURSIVE`, hierarchy traversal |

Each challenge stores a full Markdown brief (schema, task, exact output columns, ordering
rules, constraints) plus a `sql_schema` DDL + seed script. That script is executed by
`sql.js` (SQLite compiled to WASM) **in the candidate's browser** — a fresh database is
built on every run, so a destructive query can never poison a later attempt. No SQL is sent
to the server for execution.

The SQL editor opens **completely empty**. There is no starter query, no scaffold and no
comment — candidates write every character of the answer themselves. "Reset Code" on a SQL
challenge clears the editor rather than restoring a template.

Definitions live in [`backend/app/core/sql_challenges.py`](backend/app/core/sql_challenges.py);
admins can add more via **Create Test → SQL / Query** in the dashboard.

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
alembic upgrade head        # required — adds the SQL challenge columns
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

### Default Test Credentials:
- **Admin**: `akash@auronix.com` / `admin@2602!`
- **User**: `bhargavi.d@auronix.com` / `CEO@2003!`

---

## Docker Setup (Single Container)
```bash
docker-compose up --build
```
Access the full-stack web service at `http://localhost:8000`.

---

## Inspecting Database Content via Docker (`docker exec`)

### How to find your container name:
Run `docker ps` in your terminal to list all running containers. In your `docker-compose.yml`, the database container is named **`pixeltest-db`**.

---

### 1. View Users Table
```bash
docker exec pixeltest-db psql -U postgres -d pixeltest -c "SELECT id, email, role, is_active, created_at FROM users;"
```
*Expected Output:*
```text
 id |         email          | role  | is_active |          created_at           
----+------------------------+-------+-----------+-------------------------------
 1  | akash@auxonix.com      | ADMIN | t         | 2026-08-21 19:30:33.000000+00
 2  | bhargavi.d@auronix.com | USER  | t         | 2026-08-21 19:30:33.000000+00
(2 rows)
```

### 2. View Challenges Table
```bash
docker exec pixeltest-db psql -U postgres -d pixeltest -c "SELECT id, title, status, created_by, created_at FROM challenges;"
```

### 3. Open Interactive PostgreSQL Shell
```bash
docker exec -it pixeltest-db psql -U postgres -d pixeltest
```
*Once inside the shell, you can run:*
- `\dt` — List all tables
- `SELECT * FROM users;` — View users
- `\q` — Exit the shell

*(Note: If running locally without Docker/PostgreSQL using SQLite, inspect `backend/pixeltest.db` with `sqlite3 backend/pixeltest.db`)*
