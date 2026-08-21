# REST API Reference

### Auth
- `POST /api/auth/login` - Authenticate admin & retrieve JWT token
- `GET /api/auth/me` - Fetch currently logged-in user profile

### Challenges
- `GET /api/challenges` - List all challenges
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/{id}` - Fetch single challenge
- `PUT /api/challenges/{id}` - Update challenge status/metadata
- `DELETE /api/challenges/{id}` - Delete challenge
- `POST /api/challenges/{id}/reference-image` - Upload reference screenshot (Auto-detects width, height, aspect ratio)

### Projects
- `POST /api/projects` - Get or create user project for challenge
- `GET /api/projects/{id}` - Retrieve project source code
- `POST /api/projects/{id}/save` - Persist HTML/CSS/JS code changes

### Submissions
- `POST /api/projects/{id}/submit` - Create project submission
- `GET /api/submissions/{id}` - Fetch submission details
