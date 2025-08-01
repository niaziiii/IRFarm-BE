# Use Node.js 20 slim image as base
FROM node:20-slim

# Install only the essential libraries that @sparticuz/chromium needs
# These are the minimal dependencies required
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including @sparticuz/chromium
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Important: Set the HOME environment variable for chromium
ENV HOME=/tmp

# Expose the port your app runs on
EXPOSE 8000

# Start the application
CMD ["node", "index.js"]