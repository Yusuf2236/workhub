FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time
# Empty: the admin uses the API on its own host (see lib/api.ts)
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# Served by nginx under /admin; must match at build and run time
ARG ADMIN_BASE_PATH=/admin
ENV ADMIN_BASE_PATH=$ADMIN_BASE_PATH
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV ADMIN_BASE_PATH=/admin

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./

EXPOSE 3001

CMD ["npm", "run", "start"]
