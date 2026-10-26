# Fits

Deployen gaat automatisch: push naar main na groene tests; de server zet het binnen 5 minuten live als CI slaagt en /health werkt. Wijzig docker-compose.yml en Dockerfile alleen als Pieter erom vraagt. Databasemigraties moeten achterwaarts compatibel zijn.

- Tests: `npm run build && npm test` (tests/routes.test.js start de gebouwde app en vraagt /health op).
