# Security Policy & Implementation

## Preview Isolation
Candidate code (HTML, CSS, JavaScript) is rendered exclusively in a sandboxed `<iframe>` with `sandbox="allow-scripts"`.
- Prevents script access to parent frame window or DOM.
- Blocks access to host cookies, session storage, and JWT tokens stored in localStorage.
- Enforces strict origin separation.

## Authentication & Password Hashing
- Passwords are hashed using bcrypt with salt.
- API endpoints are protected via JWT bearer tokens.
