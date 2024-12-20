# official Node.js image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory, test
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install typescript @types/node @types/express
RUN npm install --save-dev tsc-watch
RUN npm i -g @nestjs/cli


# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Build the TypeScript code
RUN npm run build


# Command to run the application
CMD ["node", "dist/main.js"]