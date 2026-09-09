FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build && node dist/server.js; else npm run dev; fi"]