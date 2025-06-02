FROM node:18
WORKDIR /app

# Copy server source and root-level package files (adjust if needed)
COPY . .

# Install dependencies
RUN npm install

# Expose port the server listens on
EXPOSE 5000

# Start the backend server
CMD ["npm", "run", "dev"]
