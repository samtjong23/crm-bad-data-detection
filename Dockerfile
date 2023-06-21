# Use an official Node.js runtime as the base image
FROM node:18.16.0

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into the Docker container
COPY package*.json ./

# Install the application dependencies inside the Docker container
RUN npm install

# Copy the rest of the application code into the Docker container
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to start the application
CMD [ "npm", "start" ]
