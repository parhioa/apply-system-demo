# ---- build stage ----
FROM node:22-alpine AS build
ENV CI=1
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ---- runtime stage ----
FROM node:22-alpine
ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000
WORKDIR /app

COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["node", "build/index.js"]