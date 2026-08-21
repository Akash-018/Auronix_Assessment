# Environment Configuration Reference

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/pixeltest` |
| `JWT_SECRET` | Secret key for JWT signature | `super-secret-pixeltest-key` |
| `JWT_ALGORITHM` | Algorithm used for JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiration time for tokens | `1440` |
| `STORAGE_PROVIDER` | Asset storage provider (`local` or `s3`) | `local` |
| `ENVIRONMENT` | Deployment environment (`development` / `production`) | `development` |
| `INITIAL_ADMIN_EMAIL` | Seed admin email address | `admin@pixeltest.com` |
| `INITIAL_ADMIN_PASSWORD` | Seed admin password | `AdminPassword123!` |
