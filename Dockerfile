# Stage 1 — build React frontend
FROM node:20-alpine AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# VITE_API_URL='' means same-origin — axios uses relative paths
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Stage 2 — production backend + bundled frontend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ .
# Copy built frontend into backend's serve directory
COPY --from=frontend-build /build/frontend/dist ./frontend-dist
# Create data dir so volume mount has a landing spot
RUN mkdir -p /data
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV DATA_FILE=/data/db.json
CMD ["node", "server.js"]
