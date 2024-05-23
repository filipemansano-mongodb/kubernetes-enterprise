# Dockerfile
FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY *.js ./
COPY ca/* ./

EXPOSE 3000
CMD ["node", "app.js"]