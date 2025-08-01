# Use the official Puppeteer image which has Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Skip Puppeteer download since it's already in the image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Switch to root to install packages
USER root

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Give ownership to the pptruser
RUN chown -R pptruser:pptruser /app

# Switch back to the pptruser
USER pptruser

# Expose port
EXPOSE 8000

# Start the application
CMD ["node", "index.js"]