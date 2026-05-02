# NestJS + Next.js E-Commerce App

Full-stack e-commerce platform — NestJS REST API backend with PostgreSQL/Prisma, JWT auth, Stripe payments, and a Next.js frontend. Includes a complete production-grade CI/CD and GitOps pipeline.

---

## Table of Contents

- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Makefile Commands](#makefile-commands)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [CI/CD Pipeline](#cicd-pipeline)
- [Helm & Kubernetes Deployment](#helm--kubernetes-deployment)
- [Argo CD GitOps](#argo-cd-gitops)
- [Monitoring & Alerts](#monitoring--alerts)
- [Security](#security)

---

## Repository Structure

```
root/
├── api/                                # NestJS backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                   # JWT auth, strategies, guards
│   │   │   ├── users/                  # User CRUD, roles
│   │   │   ├── products/               # Product management
│   │   │   ├── category/               # Product categories
│   │   │   ├── cart/                   # Shopping cart
│   │   │   ├── orders/                 # Order lifecycle
│   │   │   └── payments/               # Stripe integration
│   │   ├── common/                     # Shared guards, decorators, interfaces
│   │   ├── prisma/                     # Prisma service & module
│   │   └── main.ts                     # App bootstrap
│   ├── prisma/
│   │   ├── schema.prisma               # DB models
│   │   └── migrations/
│   ├── test/                           # e2e tests
│   ├── Dockerfile                      # Multi-stage, alpine, non-root
│   ├── Makefile                        # Developer shortcuts
│   ├── sonar-project.properties
│   └── .github/workflows/
│       ├── ci-cd.yml                   # Main pipeline
│       ├── reusable-security-scan.yml
│       ├── reusable-test.yml
│       └── reusable-build-push.yml
│
├── ci-cd/                              # All deployment & infrastructure config
│   ├── helm/ecommerce-api/
│   │   ├── templates/                  # deployment, service, ingress, hpa, configmap, serviceaccount
│   │   ├── envs/                       # dev.yaml, staging.yaml, production.yaml
│   │   └── values.yaml                 # Base defaults
│   ├── gitops/apps/                    # Argo CD Application manifests
│   │   ├── dev.yaml
│   │   ├── staging.yaml
│   │   └── production.yaml
│   ├── k8s/rbac/
│   │   └── rbac-netpol.yaml            # RBAC + NetworkPolicy
│   └── monitoring/
│       ├── prometheus-rules.yaml       # Alert rules
│       └── service-monitor.yaml        # Prometheus scrape config
│
└── README.md                           # This file
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS 11 (TypeScript) |
| Database | PostgreSQL via Prisma ORM |
| Authentication | JWT — access + refresh tokens |
| Payments | Stripe |
| Validation | class-validator + class-transformer |
| Rate limiting | @nestjs/throttler (10 req / 60s) |
| API docs | Swagger / OpenAPI |
| Containerization | Docker — multi-stage, alpine, non-root |
| Orchestration | Kubernetes + Helm |
| GitOps | Argo CD |
| CI/CD | GitHub Actions |
| Code quality | SonarQube |
| Security scanning | Gitleaks, Trivy, Checkov |
| Monitoring | Prometheus + Grafana |

---

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL (local or Docker)
- Docker (for container builds)
- `kubectl` + `helm` (for Kubernetes deployments)

---

## Environment Variables

Create `api/.env` — never commit this file, it is gitignored.

```bash
# Database
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>"

# JWT
JWT_SECRET=<your-access-token-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<your-refresh-token-secret>
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_<...>
STRIPE_WEBHOOK_SECRET=whsec_<...>

# App
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### Per-environment values

| Variable | development | staging | production |
|---|---|---|---|
| `NODE_ENV` | `development` | `staging` | `production` |
| `PORT` | `3001` | `3001` | `3001` |
| `DATABASE_URL` | local postgres | staging RDS | production RDS |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | `https://staging.example.com` | `https://example.com` |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` |
| `JWT_EXPIRES_IN` | `15m` | `15m` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | `7d` | `7d` |

> In Kubernetes, all secrets are injected via a K8s Secret named `ecommerce-api-secret` — never hardcoded in Helm values.

---

## Running Locally

### 1. Install dependencies

```bash
cd api
npm ci
```

### 2. Set up the database

```bash
cd api

# Run migrations
npx prisma migrate dev

# (Optional) open visual DB browser
npx prisma studio
```

### 3. Start the API

```bash
# Development — watch mode with hot reload
npm run dev

# Standard start
npm run start

# Debug mode
npm run start:debug

# Production build then start
npm run build && npm run start:prod
```

| URL | Description |
|---|---|
| `http://localhost:3001/api/v1` | API base |
| `http://localhost:3001/api/docs` | Swagger UI |

---

## Running with Docker

```bash
# Build image
docker build -t ecommerce-api:local ./api

# Run with env file
docker run --env-file api/.env -p 3001:3001 ecommerce-api:local
```

The Dockerfile uses a 3-stage build:

1. `deps` — installs production-only dependencies
2. `builder` — compiles TypeScript
3. `runner` — minimal alpine image, non-root user, read-only filesystem

---

## Makefile Commands

Run from the repo root:

```bash
make install        # npm ci inside api/
make lint           # ESLint with auto-fix
make test           # Jest unit tests
make test-cov       # Jest with coverage report (output: api/coverage/)
make build          # nest build → api/dist/
make docker-build   # Docker build tagged sha-<git-sha>
make docker-push    # docker-build + push to registry
make helm-lint      # Helm lint against dev values
make deploy-dev     # Helm upgrade/install → ecommerce-dev namespace
make deploy-staging # Helm upgrade/install → ecommerce-staging namespace
```

---

## Testing

```bash
cd api

# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report — must stay above 80% (enforced in CI)
npm run test:cov

# e2e tests
npm run test:e2e
```

Coverage output is written to `api/coverage/lcov.info` and consumed by SonarQube in CI.

---

## API Reference

Base path: `/api/v1`
Interactive docs: `http://localhost:3001/api/docs`

| Module | Base route | Key endpoints |
|---|---|---|
| Auth | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /logout`, `POST /refresh` |
| Users | `/api/v1/users` | `GET /me`, `GET /` (admin), `PATCH /:id`, `DELETE /:id` |
| Products | `/api/v1/products` | `GET /`, `GET /:id`, `POST /` (admin), `PATCH /:id`, `DELETE /:id` |
| Categories | `/api/v1/categories` | `GET /`, `POST /` (admin), `PATCH /:id`, `DELETE /:id` |
| Cart | `/api/v1/cart` | `GET /`, `POST /items`, `PATCH /items/:id`, `DELETE /items/:id` |
| Orders | `/api/v1/orders` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id/status` (admin) |
| Payments | `/api/v1/payments` | `POST /intent`, `POST /webhook` |

### Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Refresh tokens are sent to `POST /api/v1/auth/refresh` with:

```
Authorization: Bearer <refresh_token>
```

### Roles

| Role | Access |
|---|---|
| `USER` | Own profile, cart, orders, payments |
| `ADMIN` | All of the above + manage products, categories, all users/orders |

---

## Database Schema

Managed by Prisma. Schema at `api/prisma/schema.prisma`.

| Model | Key fields |
|---|---|
| `User` | `id`, `email`, `password` (bcrypt), `role` (USER/ADMIN), `refreshToken` |
| `Product` | `id`, `name`, `price`, `stock`, `sku` (unique), `categoryId`, `isActive` |
| `Category` | `id`, `name`, `slug` (unique), `isActive` |
| `Cart` | `id`, `userId`, `checkedOut` |
| `CartItem` | `cartId + productId` (unique), `quantity` |
| `Order` | `id`, `orderNumber`, `status` (PENDING/PROCESSING/SHIPPED/DELIVERED/CANCELLED), `totalAmount` |
| `OrderItem` | `orderId`, `productId`, `quantity`, `price` |
| `Payment` | `orderId` (unique), `amount`, `status` (PENDING/COMPLETED/FAILED/REFUNDED), `transactionId` |

```bash
# Apply a new migration
cd api && npx prisma migrate dev --name <migration-name>

# Reset DB (dev only — destructive)
cd api && npx prisma migrate reset

# Generate Prisma client after schema changes
cd api && npx prisma generate
```

---

## CI/CD Pipeline

Defined in `api/.github/workflows/ci-cd.yml`.

Triggers on push to `main`, `develop`, `release/**` and on PRs to `main` / `develop`.

```
Security Scan → Build → Test → SonarQube → Containerize + Image Scan → Push → Deploy Trigger
```

### Stages

| # | Stage | Tool | Fails on |
|---|---|---|---|
| 1 | Secrets scan | Gitleaks | Any secret detected |
| 1 | Filesystem scan | Trivy | CRITICAL or HIGH CVE |
| 1 | IaC scan | Checkov | Policy violation |
| 2 | Build | NestJS / npm | Compile error |
| 3 | Unit tests + coverage | Jest | Failure or < 80% line coverage |
| 4 | Code quality | SonarQube | Quality gate failure |
| 5 | Docker build | Buildx + GHA cache | Build error |
| 6 | Image scan | Trivy | CRITICAL or HIGH CVE in image |
| 7 | Push to GHCR | docker/build-push-action | Only after all scans pass |
| 8 | GitOps update | GitHub API | Helm values `image.tag` patched |

### Branch → Environment mapping

| Branch | Environment | Argo CD sync |
|---|---|---|
| `develop` | dev | Automated + self-heal |
| `release/**` | staging | Automated, no self-heal |
| `main` | production | Manual approval required |

### Image tagging strategy

Every build produces three tags simultaneously:

| Tag | Example | Purpose |
|---|---|---|
| `sha-<short>` | `sha-a1b2c3` | Immutable — exact commit traceability |
| `<semver>` | `v1.4.2` | Triggered by Git version tags |
| `<branch>-latest` | `develop-latest` | Mutable env pointer |

CI always writes `sha-<short>` into the GitOps Helm values file. The `*-latest` tags are convenience aliases only.

### Required GitHub Secrets

Configure in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `SONAR_TOKEN` | SonarQube authentication token |
| `SONAR_HOST_URL` | SonarQube server URL e.g. `https://sonar.example.com` |
| `GITOPS_TOKEN` | GitHub PAT with `repo` write scope on the GitOps repo |
| `GITOPS_REPO` | GitOps repo name e.g. `your-org/gitops-repo` |

---

## Helm & Kubernetes Deployment

Charts live in `ci-cd/helm/ecommerce-api/`.

### Create the K8s Secret (once per namespace, out of band)

```bash
kubectl create secret generic ecommerce-api-secret \
  --namespace ecommerce-dev \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=JWT_REFRESH_SECRET="..." \
  --from-literal=STRIPE_SECRET_KEY="sk_test_..." \
  --from-literal=STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Deploy

```bash
# Lint first
helm lint ci-cd/helm/ecommerce-api \
  -f ci-cd/helm/ecommerce-api/values.yaml \
  -f ci-cd/helm/ecommerce-api/envs/dev.yaml

# Dev
helm upgrade --install ecommerce-api-dev ci-cd/helm/ecommerce-api \
  --namespace ecommerce-dev --create-namespace \
  --values ci-cd/helm/ecommerce-api/values.yaml \
  --values ci-cd/helm/ecommerce-api/envs/dev.yaml \
  --set image.tag=sha-<your-sha>

# Staging
helm upgrade --install ecommerce-api-staging ci-cd/helm/ecommerce-api \
  --namespace ecommerce-staging --create-namespace \
  --values ci-cd/helm/ecommerce-api/values.yaml \
  --values ci-cd/helm/ecommerce-api/envs/staging.yaml \
  --set image.tag=sha-<your-sha>

# Production
helm upgrade --install ecommerce-api-production ci-cd/helm/ecommerce-api \
  --namespace ecommerce-production --create-namespace \
  --values ci-cd/helm/ecommerce-api/values.yaml \
  --values ci-cd/helm/ecommerce-api/envs/production.yaml \
  --set image.tag=sha-<your-sha>
```

### Environment resource profiles

| Setting | dev | staging | production |
|---|---|---|---|
| Replicas | 1 | 2 | 3 |
| CPU request | 50m | 100m | 200m |
| CPU limit | 250m | 500m | 1000m |
| Memory request | 128Mi | 256Mi | 512Mi |
| Memory limit | 256Mi | 512Mi | 1Gi |
| HPA | disabled | 2–5 pods | 3–10 pods |
| TLS | no | no | yes |

---

## Argo CD GitOps

Manifests in `ci-cd/gitops/apps/`.

```bash
kubectl apply -f ci-cd/gitops/apps/dev.yaml
kubectl apply -f ci-cd/gitops/apps/staging.yaml
kubectl apply -f ci-cd/gitops/apps/production.yaml
```

| App | Namespace | Auto-sync | Self-heal | Prune |
|---|---|---|---|---|
| `ecommerce-api-dev` | `ecommerce-dev` | yes | yes | yes |
| `ecommerce-api-staging` | `ecommerce-staging` | yes | no | yes |
| `ecommerce-api-production` | `ecommerce-production` | no | no | yes |

Production sync requires a manual click in the Argo CD UI or:

```bash
argocd app sync ecommerce-api-production
```

---

## Monitoring & Alerts

```bash
kubectl apply -f ci-cd/monitoring/prometheus-rules.yaml
kubectl apply -f ci-cd/monitoring/service-monitor.yaml
```

| Alert | Condition | Severity |
|---|---|---|
| `HighErrorRate` | HTTP 5xx rate > 5% over 5 min | critical |
| `PodCrashLooping` | > 3 restarts in 15 min | critical |
| `HighMemoryUsage` | Memory > 85% of limit for 5 min | warning |

Metrics scraped from `/metrics` on port `3001`, auto-discovered via pod annotations set in the Helm chart.

---

## Security

| Control | Implementation |
|---|---|
| No secrets in Git | All injected via K8s Secret at runtime |
| Non-root container | `appuser` created in Dockerfile |
| Read-only filesystem | `readOnlyRootFilesystem: true`, `/tmp` mounted as emptyDir |
| Dropped capabilities | `capabilities.drop: [ALL]` |
| Network isolation | NetworkPolicy — deny all, allow only ingress-nginx → 3001 and egress to PostgreSQL + DNS |
| RBAC | ServiceAccount scoped to `get/list` on ConfigMaps and Secrets only |
| Rate limiting | 10 requests / 60s per IP via `@nestjs/throttler` |
| Shift-left scanning | Gitleaks + Trivy + Checkov run before build — pipeline fails on CRITICAL/HIGH |

---

## License

MIT
