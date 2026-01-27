# ===================================
# Etapa 1: Dependencias
# ===================================
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias del sistema necesarias para node-gyp
RUN apk add --no-cache libc6-compat python3 make g++

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias de producción y desarrollo
RUN npm ci

# ===================================
# Etapa 2: Builder
# ===================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependencias desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno necesarias para el build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# ===================================
# IMPORTANTE: Variables NEXT_PUBLIC_* se embeben en el bundle
# durante el build. DEBEN pasarse como build args.
# ===================================

# Firebase Client SDK (NEXT_PUBLIC_* = embebidas en cliente)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID

# Otras variables públicas
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY

# Variables de servidor (solo para evitar warnings en build)
ARG UPSTASH_REDIS_REST_URL=""
ARG UPSTASH_REDIS_REST_TOKEN=""

# Setear como ENV para que Next.js las use durante el build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY=$NEXT_PUBLIC_STORAGE_ENCRYPTION_KEY
ENV UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL
ENV UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN

# Construir la aplicación Next.js
RUN npm run build

# ===================================
# Etapa 3: Runner (Producción)
# ===================================
FROM node:20-alpine AS runner
WORKDIR /app

# Configurar como producción
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /app/public ./public

# Copiar archivos estáticos generados por Next.js
# Next.js compila automáticamente archivos estáticos a `.next/static`
# Estos deben ser copiados con ownership correcto
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar mensajes de i18n
COPY --from=builder --chown=nextjs:nodejs /app/src/messages ./src/messages

# Crear directorio de logs con permisos correctos
RUN mkdir -p /app/app-logs && chown -R nextjs:nodejs /app/app-logs

# Cambiar al usuario no-root
USER nextjs

# Exponer el puerto
EXPOSE 3000

# Variable de entorno para el puerto
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando de inicio
CMD ["node", "server.js"]
