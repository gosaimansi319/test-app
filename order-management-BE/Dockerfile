FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production \
	PORT=5000 \
	MONGO_URI=mongodb://mongo:27017/order-management

EXPOSE 5000

CMD ["node", "server.js"]
