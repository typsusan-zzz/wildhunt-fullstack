# Wildhunt Fullstack

Monorepo for the Wildhunt game client and admin/backend service.

## Structure

- `frontend/` - Vite + TypeScript game client.
- `backend/` - Spring Boot + Maven multi-module backend.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Backend

```powershell
cd backend
mvn test
mvn package
```

The backend reads local runtime values from environment variables. Keep private overrides out of Git.
