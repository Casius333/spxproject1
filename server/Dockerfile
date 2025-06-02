FROM node:18
WORKDIR /app

# Copy only the server package.json and lock file (optional, adjust as needed)
COPY package*.json ./

# Install only server dependencies
RUN npm install

# Copy the rest of the server files
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
