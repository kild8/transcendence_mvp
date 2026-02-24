# frontend_files Dockerfile: build static assets with node, serve with nginx
FROM node:25-alpine3.22 AS build
WORKDIR /app
COPY ./frontend_files/package*.json .
RUN npm install
COPY ./frontend_files/. .
RUN npm run build

FROM nginx:1.24.0-alpine

RUN apk add --no-cache inotify-tools \
    && addgroup -g 1000 nginxuser \
    && adduser -u 1000 -G nginxuser -S -D nginxuser

COPY --from=build /app/dist /usr/share/nginx/html/dist

COPY ./frontend_files/index.html /usr/share/nginx/html/index.html

RUN rm /etc/nginx/conf.d/default.conf

COPY ./frontend_files/default-avatar.png /usr/share/nginx/html/default-avatar.png

COPY ./config/nginx.conf /etc/nginx/nginx.conf

COPY --chmod=+x startup_scripts/. /usr/local/bin/.

RUN mkdir /vault \
	&& chown -R nginxuser:nginxuser /usr/share/nginx/html /var/log/nginx /etc/nginx /vault /var/cache/nginx /run

EXPOSE 80

USER nginxuser

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["nginx", "-g", "daemon off;"]
