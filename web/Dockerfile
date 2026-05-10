FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["sh", "-lc", "npm run build && npm run preview -- --host 0.0.0.0 --port 5173"]
