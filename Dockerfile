# Stage 1: Build TypeScript
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all source
COPY . .

# Build TypeScript -> dist/
RUN npm run build

# Stage 2: Run
FROM node:18-alpine
WORKDIR /app

# Copy only runtime dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built files
COPY --from=build /app/dist ./dist

EXPOSE 5050
CMD ["node", "dist/index.js"]
