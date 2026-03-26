FROM node:22-alpine

WORKDIR /app

# Copy project files
COPY package.json ./
COPY server.js ./
COPY agents/ ./agents/
COPY public/ ./public/

# Create uploads directory
RUN mkdir -p uploads

# Expose port (AWS/Railway/Render will override with PORT env var)
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
