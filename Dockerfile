# Stap 1: de app bouwen.
FROM node:22-slim AS bouw
# better-sqlite3 wordt bij het installeren gecompileerd; daarvoor zijn Python, make en g++ nodig.
# Alleen in deze bouwstap: het eindimage hieronder krijgt ze niet.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm test && npm prune --omit=dev

# Stap 2: alleen wat nodig is om te draaien.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    FITS_DATA=/data \
    ADDRESS_HEADER=X-Forwarded-For \
    XFF_DEPTH=1 \
    BODY_SIZE_LIMIT=25M
COPY --from=bouw /app/build ./build
COPY --from=bouw /app/node_modules ./node_modules
COPY --from=bouw /app/package.json ./
COPY scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/gezond').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "build"]
