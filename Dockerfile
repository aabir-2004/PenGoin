FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including build tools for native modules)
RUN apk add --no-cache python3 make g++ && npm install

# Copy the server script
COPY server.ts ./

# Hugging Face Spaces require port 7860
ENV PORT=7860
EXPOSE 7860

# Run the tldraw sync server
CMD ["npm", "run", "sync"]
