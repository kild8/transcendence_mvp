VOLUME_FOLDER								= ./volumes
PROJECT_NAME								= transcendence
DOCKER_COMPOSE_FILE					?= ./docker-compose.yml
SECRET_FOLDER								= secrets
NGINX_SERVER_CRT_FILE				= ${SECRET_FOLDER}/nginx_server_crt.txt
NGINX_SERVER_KEY_FILE				= ${SECRET_FOLDER}/nginx_server_key.txt

up:
	mkdir -p ${SECRET_FOLDER}
#Generate Certificates
	if [ ! "$$(ls ${SECRET_FOLDER} | grep nginx)" ]; then \
		openssl req -x509 -newkey rsa:2048 -noenc -keyout ${NGINX_SERVER_KEY_FILE} -out ${NGINX_SERVER_CRT_FILE} -days 3650 -subj "/C=CH/ST=Vaud/L=Lausanne/O=webforge/OU=cyber/CN=localhost" -addext "subjectAltName=DNS:localhost,DNS:localhost,DNS:127.0.0.1"; \
	fi

#	chown -R $(USER):$(USER) ${SECRET_FOLDER}
	chmod 777 -R ${SECRET_FOLDER}

	docker compose -f $(DOCKER_COMPOSE_FILE) -p ${PROJECT_NAME} up -d --build

down:
	docker compose -f $(DOCKER_COMPOSE_FILE) -p ${PROJECT_NAME} down

clear:
	docker compose -f $(DOCKER_COMPOSE_FILE) -p ${PROJECT_NAME} down --rmi all -v

peek:
	docker container ls -a
	docker network ls
	docker volume ls


.PHONY: up down clear peek
