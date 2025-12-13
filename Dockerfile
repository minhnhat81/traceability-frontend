# ============================
# Frontend (Vite + React)
# ============================
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve static content
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck cho Nginx
HEALTHCHECK --interval=10s --timeout=5s --retries=3 CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
