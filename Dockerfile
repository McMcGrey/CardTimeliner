# Multi-stage build for production
# Stage 1: Build the Vue application
FROM node:25-alpine AS build-stage

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine AS production-stage

# Copy built files from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy nginx configuration (optional - uncomment if you create one)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
