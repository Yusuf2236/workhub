# Multi-stage Dockerfile for WorkHub Backend API
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/workhub-api ./cmd/api

# Final minimal runner stage
FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/bin/workhub-api /app/workhub-api
COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/.env.example /app/.env.example

EXPOSE 8080

CMD ["/app/workhub-api"]
