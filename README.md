# Full MVP — Frontend (TypeScript + Tailwind) + Backend (Fastify) + Docker Compose

Structure:
- frontend/ : Vanilla TypeScript + Tailwind project. Builds to `dist/` and served by nginx. `nginx` proxies `/api/` to backend.
- backend/ : Fastify (Node.js) API on port 3000.
- docker-compose.yml: builds and runs both services.

## Quick start

Build and run both services:
```bash
docker compose up --build
```

- App : https://localhost
- Metrics monitoring : https://localhost/mo-metrics
- Logs monitoring : https://localhost/mo-logs

To stop:
```bash
docker compose down
```
