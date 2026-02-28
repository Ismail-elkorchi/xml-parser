FROM node:24-bookworm

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build
