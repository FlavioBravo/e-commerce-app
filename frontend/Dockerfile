FROM node:20-bookworm-slim
WORKDIR /code
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]
