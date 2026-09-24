# Infrastructure

This folder contains infrastructure and deployment resources for local development and cloud deployment.

## Contents

```text
infra/
├── docker/
│   ├── backend.Dockerfile
│   └── nginx.conf
├── k8s/
│   ├── namespace.yaml
│   ├── deployment.yaml
│   └── ingress.yaml
├── terraform/
│   └── main.tf
├── monitoring/
│   ├── prometheus.yml
│   └── grafana-dashboard.json
└── README.md
```

## Local services

- PostgreSQL
- Redis
- MinIO
- backend API
- optional reverse proxy

## Deployment model

- local via Docker Compose
- cloud via Kubernetes or direct VM deployment
- object storage via MinIO or Cloudflare R2
