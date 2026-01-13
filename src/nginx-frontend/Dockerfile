# frontend Dockerfile: build static assets with node, serve with nginx
FROM node:25-alpine3.22 AS build
WORKDIR /app
COPY ./frontend/package*.json .
RUN npm install
COPY ./frontend/. .
RUN npm run build

FROM debian:11.11

# Install nginx

# Installer les dépendances nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg2 \
    ca-certificates \
    lsb-release \
    debian-archive-keyring \
 	&& rm -rf /var/lib/apt/lists/*

# Ajouter la clé officielle Nginx
RUN curl -fsSL https://nginx.org/keys/nginx_signing.key \
    | gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

# Ajouter le dépôt Nginx pour Debian 11
RUN echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/debian/ bullseye nginx" \
    | tee /etc/apt/sources.list.d/nginx.list

# Mettre à jour la liste des paquets
RUN apt-get update

RUN apt-get install -y nginx=1.24.0-1~bullseye

# Install modsecurity
RUN apt-get install -y apt-utils autoconf automake build-essential git libcurl4-openssl-dev libgeoip-dev liblmdb-dev libpcre++-dev libtool libxml2-dev libyajl-dev pkgconf wget zlib1g-dev libpcre2-dev

RUN git clone --depth 1 -b v3/master --single-branch https://github.com/SpiderLabs/ModSecurity

RUN cd ModSecurity \
	&& git submodule init \
	&& git submodule update \
	&& ./build.sh \
	&& ./configure \
	&& make \
	&& make install \
	&& cd ..

RUN git clone --depth 1 https://github.com/SpiderLabs/ModSecurity-nginx.git

RUN wget https://nginx.org/download/nginx-1.24.0.tar.gz \
	&& tar zxvf nginx-1.24.0.tar.gz \
	&& rm nginx-1.24.0.tar.gz

RUN cd nginx-1.24.0 \
	&& ./configure --with-compat --add-dynamic-module=../ModSecurity-nginx \
	&& make modules \
	&& cp objs/ngx_http_modsecurity_module.so /etc/nginx/modules \
	&& cd ..

RUN mkdir /etc/nginx/modsec \
	&& wget -P /etc/nginx/modsec/ https://raw.githubusercontent.com/SpiderLabs/ModSecurity/v3/master/modsecurity.conf-recommended \
	&& mv /etc/nginx/modsec/modsecurity.conf-recommended /etc/nginx/modsec/modsecurity.conf \
	&& cp ModSecurity/unicode.mapping /etc/nginx/modsec \
	&& sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/nginx/modsec/modsecurity.conf

COPY --from=build /app/dist /usr/share/nginx/html/dist

COPY ./frontend/index.html /usr/share/nginx/html/index.html

COPY ./nginx.conf /etc/nginx/nginx.conf

RUN rm /etc/nginx/conf.d/default.conf

COPY ./frontend/default-avatar.png /usr/share/nginx/html/default-avatar.png

COPY ./modsec.conf /etc/nginx/modsec/main.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
