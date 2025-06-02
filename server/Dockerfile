FROM node:18
WORKDIR /app

# Copy server files
COPY . .

# Install dependencies
RUN npm install

# Expose port the server listens on
EXPOSE 5000

# Start the backend server
CMD ["npm", "run", "dev"]
