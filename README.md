# refio-blog-backend

Express API for the Refio blog. Frontend is in `refio-blog` (client only).

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Returns `{ access_token, user }` |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/verify-password` | Verify password |
| PUT | `/api/auth/password` | Change password |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/posts` | Public published posts |
| GET | `/api/posts/:id` | Public post by id |
| GET/POST/PUT/DELETE | `/api/admin/posts` | Admin CRUD (Bearer + admin role) |
| POST | `/api/upload` | Image upload (Bearer) → `{ url }` |

## Setup

Copy `.env.example` to `.env` and set:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CONNECTION_STRING` (Postgres for admin role checks)
- `STORAGE_BUCKET` (default `post-images`)
- `CLIENT_URL` (optional CORS)

```bash
npm install
npm run dev
```

Server: http://localhost:4000
