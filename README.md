# ⚡ Enterprise DevOps Telemetry & Infrastructure Platform (v2.0)

A comprehensive, production-grade DevOps engineering project featuring a multi-tier microservices architecture, automated database migrations, in-memory caching, time-series monitoring with Prometheus, multi-stage Docker containerization, Kubernetes manifests, and an enterprise Jenkins Declarative CI/CD pipeline.

---

## 🏛️ System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   Developer / Git                      │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ (Push / Webhook)
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               Jenkins CI/CD Automation                 │
                    │  [Lint] -> [Audit] -> [Test] -> [Build] -> [SmokeTest] │
                    └──────────────────────────┬─────────────────────────────┘
                                               │ (Deploy via Compose / K8s)
                                               ▼
   ┌───────────────────────────────────────────────────────────────────────────────────────┐
   │                               Docker / Kubernetes Network                             │
   │                                                                                       │
   │   ┌──────────────────────────┐             ┌──────────────────────────────────────┐   │
   │   │   Web App / Telemetry    │◄───────────►│       PostgreSQL Database            │   │
   │   │   (Express + Metrics)    │             │   (Services, Deployments Schema)     │   │
   │   │   Port: 3003             │             │   Port: 5433                         │   │
   │   └─────────────┬────────────┘             └──────────────────────────────────────┘   │
   │                 │                                                                     │
   │                 ├─────────────────────────►┌──────────────────────────────────────┐   │
   │                 │                          │          Redis Cache Layer           │   │
   │                 │                          │   (Sub-millisecond query cache)      │   │
   │                 │                          │   Port: 6380                         │   │
   │                 ▼                          └──────────────────────────────────────┘   │
   │   ┌──────────────────────────┐                                                        │
   │   │   Prometheus Exporter    │                                                        │
   │   │   Scrapes /metrics       │                                                        │
   │   │   Port: 9091             │                                                        │
   │   └──────────────────────────┘                                                        │
   └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key DevOps Engineering Features

1. **Multi-Tier Microservices Stack**:
   - **Frontend & REST API**: Express web app with real-time DevOps Control Center UI.
   - **PostgreSQL Database (`postgres:16-alpine`)**: Automatic table schema initialization, seed data, and persistent storage.
   - **Redis Cache (`redis:7-alpine`)**: In-memory caching layer with TTL expiration and connection resilience.
   - **Prometheus Monitoring (`prom/prometheus:v2.54.1`)**: Time-series telemetry scraping application metrics on `/metrics`.

2. **Enterprise Jenkins CI/CD Quality Gates (`Jenkinsfile`)**:
   - **Stage 1: SCM Checkout** — Secure Git code checkout.
   - **Stage 2: Dependencies & Linting** — Deterministic `npm ci`.
   - **Stage 3: Security & Vulnerability Audit** — Automated `npm audit` scanning.
   - **Stage 4: Automated Testing & Coverage** — Jest unit & integration tests with coverage reports.
   - **Stage 5: Multi-Stage Docker Build** — Optimized multi-stage build, minimal Alpine base, non-root user.
   - **Stage 6: Ephemeral Smoke & Health Check** — Spins up isolated test container, verifies `/health/liveness` and `/metrics`.
   - **Stage 7: Production Orchestration** — Zero-downtime deployment via Docker Compose.
   - **Stage 8: Post-Deploy Verification** — Healthcheck probe confirmation before completing build.

3. **Kubernetes (K8s) Production Manifests (`k8s/`)**:
   - Complete definitions for `Namespace`, `ConfigMap`, `Secret`, `Deployment` (with RollingUpdate strategy and resource requests/limits), `Service`, and health probes (`livenessProbe`, `readinessProbe`).

---

## 📂 Repository Structure

```
C:\devops_mini_project
├── Dockerfile                    # Multi-stage production container build (Alpine, non-root)
├── docker-compose.yml            # Multi-tier stack (App, Postgres, Redis, Prometheus, Jenkins)
├── Jenkinsfile                   # Enterprise Declarative 8-stage CI/CD pipeline
├── prometheus.yml                # Prometheus metrics scraper configuration
├── package.json                  # Dependencies (Express, PG, Redis, Prom-Client, Jest)
├── README.md                     # Documentation & setup guides
├── k8s/
│   └── deployment.yaml           # Kubernetes Deployment, Service, ConfigMap & Secrets
├── src/
│   ├── server.js                 # Server entrypoint with graceful shutdown handlers
│   ├── app.js                    # Express app with UI, /metrics, /health, /api
│   ├── db.js                     # PostgreSQL connection pool & resilient fallback
│   ├── cache.js                  # Redis caching client & fallback
│   └── metrics.js               # Prometheus metrics registry & middleware
├── tests/
│   └── app.test.js               # Jest test suite (7 comprehensive test cases)
└── scripts/
    ├── start.ps1                 # Full stack startup script
    └── get-jenkins-password.ps1  # Jenkins credential helper
```

---

## 🛠️ Running the Stack

### Start with Docker Compose
```powershell
docker compose up -d --build
```

### Accessing Endpoints
| Component | URL | Description |
| :--- | :--- | :--- |
| **DevOps Control Center** | [http://localhost:3003](http://localhost:3003) | Live dashboard, system telemetry, services registry |
| **Prometheus Exporter** | [http://localhost:3003/metrics](http://localhost:3003/metrics) | Standard Prometheus metrics endpoint |
| **Prometheus UI** | [http://localhost:9091](http://localhost:9091) | Target scrapers, time-series graphs |
| **PostgreSQL** | `localhost:5433` | Database (`devops_db`, user: `postgres`) |
| **Redis** | `localhost:6380` | In-memory key-value cache |
| **Jenkins Controller** | [http://localhost:8080](http://localhost:8080) | CI/CD automation server |

---

## 🧪 Testing

```bash
# Run unit & integration test suite
npm test

# Run tests with code coverage report
npm run test:coverage
```
