FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY build ./build

# Create volume mount point
VOLUME /data
VOLUME /index

ENV DB_PATH=/index/second-brain.db

CMD ["node", "build/index.js"]
