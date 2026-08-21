# System Architecture & Design

## System Architecture Diagram
```
Browser (React + Monaco Editor + Sandboxed iframe)
   │
   ├─► GET/POST /api/* (FastAPI Backend)
   │      │
   │      ├─► PostgreSQL (SQLAlchemy 2.x ORM + Alembic)
   │      │
   │      └─► StorageService Abstraction (Local Storage / AWS S3)
   │
   └─► Sandboxed iframe (Client-side HTML/CSS rendering)
```

## Security & Sandboxing Architecture
- User code is rendered via `<iframe sandbox="allow-scripts" srcDoc="..." />`.
- Prevents cross-context contamination (no parent DOM access, no host localStorage or authentication token access).
- Console errors are caught inside the iframe context and transferred via `window.postMessage` to host state.
