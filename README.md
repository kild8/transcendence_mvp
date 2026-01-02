# Transcendence — MVP

Pong SPA web application with Node.js backend, integrated monitoring, and logging.

## Project Structure

- `frontend/` → Vanilla TypeScript + Tailwind. Builds to `dist/`, served by Nginx.  
- `backend/` → Fastify (Node.js) API on port 3000.  
- `backend/data/` → SQLite database.  
- `backend/uploads/` → Uploaded files (avatars, other uploads).  
- `src/` → Additional services:  
  - alert-manager  
  - cadvisor  
  - discord-webhook  
  - elasticsearch  
  - filebeat  
  - grafana  
  - kibana  
  - logstash  
  - nginx  
  - node-exporter  
  - prometheus  
- `docker-compose.yml` → Light compose (frontend + backend).  
- `.docker-compose.yml.all` → Full compose (all monitoring and logging services).  

Nginx serves the frontend and proxies `/api/` requests to the backend.

## Quick Start

**Run light version (frontend + backend):**
```bash
make up
```

**Run full version (with monitoring and logs):**
```bash
make DOCKER_COMPOSE_FILE=.docker-compose.yml.all up
```

Application: https://localhost  
Metrics: https://localhost/mo-metrics (WIP)  
Logs: https://localhost/mo-logs (WIP)  

Stop:
```bash
make down
make DOCKER_COMPOSE_FILE=.docker-compose.yml.all down
```

Clean everything (containers, volumes, images):
```bash
make clear
```
