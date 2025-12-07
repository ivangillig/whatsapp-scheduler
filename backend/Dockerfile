FROM node:20-alpine

WORKDIR /app

# Instalar dependencias para better-sqlite3
RUN apk add --no-cache python3 make g++

# Copiar package.json primero para cache de dependencias
COPY package*.json ./

RUN npm install

# Copiar código fuente
COPY src ./src

# Crear directorio de datos
RUN mkdir -p /app/data

# Puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/scheduler.db
ENV AUTH_PATH=/app/data/auth

CMD ["node", "src/index.js"]
