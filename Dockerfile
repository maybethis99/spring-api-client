# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

ARG REACT_APP_API_BASE=http://localhost:8189
ENV REACT_APP_API_BASE=$REACT_APP_API_BASE

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
