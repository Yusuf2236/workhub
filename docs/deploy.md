# Production deploy (docker compose)

Only nginx is reachable from outside (ports 80/443). Postgres, Redis, the API, the web
app and the admin listen on `127.0.0.1` of the server.

| URL | Service |
|---|---|
| `https://<domain>/` | web app |
| `https://<domain>/vacancies/<id>` | public vacancy page (indexed by search engines) |
| `https://<domain>/admin` | admin dashboard |
| `https://<domain>/api/v1/...` | API |

## 1. Configure

```bash
cp .env.production.example .env
# fill in at least: DB_PASSWORD, JWT_SECRET, ONEID_ENCRYPTION_KEY, PUBLIC_SITE_URL
docker compose up -d --build
```

## 2. HTTPS (Let's Encrypt)

Point the domain's DNS A record at the server, then with the stack running on HTTP:

```bash
docker compose run --rm --entrypoint certbot certbot certonly \
  --webroot -w /var/www/certbot --cert-name wzone \
  -d your-domain.uz -d www.your-domain.uz \
  --email you@your-domain.uz --agree-tos --no-eff-email
```

Then set `NGINX_CONF=nginx-https.conf` in `.env` and start renewal:

```bash
docker compose --profile https up -d
```

`certbot` renews every 12 hours when needed and nginx reloads every 12 hours.

## 3. Vacancy import from hh.uz

Register an application at https://dev.hh.ru and set `HH_CLIENT_ID` and
`HH_CLIENT_SECRET` (or `HH_APP_TOKEN`). Check it works:

```bash
docker logs workhub_backend 2>&1 | grep Aggregator
# expected: [Aggregator] hh.uz sync done: N new, M updated
```

Without these the log says `[Aggregator] disabled` and no new vacancies arrive.

## 4. Email

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Without SMTP,
verification and password-reset emails are not sent.

## 5. Backups

The `backup` service writes `./backups/workhub-<date>.dump` every 24 hours and deletes
dumps older than `BACKUP_KEEP_DAYS`. These files are on the same disk, so copy them to
another place as well (another server, object storage), together with `./backend/uploads`.

Take a dump by hand (e.g. before an update):

```bash
docker exec workhub_postgres pg_dump -U postgres -Fc workhub > before-update.dump
```

Restore into the running database (this replaces its contents):

```bash
docker exec -i workhub_postgres pg_restore -U postgres -d workhub --clean --if-exists < backups/workhub-YYYY-MM-DD_HHMM.dump
```

## Migrations

Migrations in `backend/migrations` run automatically when the API starts.
`011_remove_duplicate_vacancies.sql` deletes repeated imported vacancies (same title,
company and region); take a dump before deploying it for the first time.
