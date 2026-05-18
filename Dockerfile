FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including tsx for the server)
RUN npm install

# Copy the server script
COPY server.ts ./

# Hugging Face Spaces require port 7860
ENV PORT=7860
EXPOSE 7860

# Run the Hocuspocus WebSocket sync server
CMD ["npm", "run", "sync"]
