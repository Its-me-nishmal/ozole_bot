FROM node:22

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# set environment variables
ENV NODE_ENV production

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD [ "node", "server.js" ]