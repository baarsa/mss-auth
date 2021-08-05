FROM node:12
WORKDIR /usr/src/app
ENV PORT 8080
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8080
# add another dockerfile for development
CMD [ "npm", "start" ]
