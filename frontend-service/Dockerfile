# Stage 1 - Prepare static assets
FROM alpine:3.22 AS builder

WORKDIR /app

COPY index.html .
COPY nginx.conf .

# Stage 2 - Runtime image
FROM nginx:1.25-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/index.html /usr/share/nginx/html/index.html

EXPOSE 81
