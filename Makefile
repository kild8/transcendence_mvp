PROJECT_NAME			:=	transcendence
DOCKER_COMPOSE_FILE		:=	$(CURDIR)/docker-compose.yml
VAULT_ACCESS_DIR_PATH	:=	$(CURDIR)/vault_access
SECRETS_DIR_PATH		:= 	$(CURDIR)/secrets
TUNNEL_URL_DIR_PATH		:=	$(CURDIR)/tunnel_url
DOCKER_COMPOSE_COMMAND	:=	SECRETS_DIR_PATH=$(SECRETS_DIR_PATH) \
							VAULT_ACCESS_DIR_PATH=$(VAULT_ACCESS_DIR_PATH) \
							TUNNEL_URL_DIR_PATH=$(TUNNEL_URL_DIR_PATH) \
							docker compose -f $(DOCKER_COMPOSE_FILE) -p $(PROJECT_NAME)

RESTART_TARGET			?=	none

cloud-up:
	@mkdir  -p $(TUNNEL_URL_DIR_PATH) && chmod 777 $(TUNNEL_URL_DIR_PATH)
	TUNNEL_URL_DIR_PATH=$(TUNNEL_URL_DIR_PATH) docker compose -f $(CURDIR)/cloudflared/docker-compose.yml -p $(PROJECT_NAME) up -d

cloud-down:
	TUNNEL_URL_DIR_PATH=$(TUNNEL_URL_DIR_PATH) docker compose -f $(CURDIR)/cloudflared/docker-compose.yml -p $(PROJECT_NAME) down

up:
	@mkdir -p $(SECRETS_DIR_PATH) && chmod 777 $(SECRETS_DIR_PATH)
	@mkdir  -p $(VAULT_ACCESS_DIR_PATH) && chmod 777 $(VAULT_ACCESS_DIR_PATH)
	@$(DOCKER_COMPOSE_COMMAND) up -d
	@echo Done

down:
	@$(DOCKER_COMPOSE_COMMAND) down

clear-images:
	@$(DOCKER_COMPOSE_COMMAND) down --rmi all

clear-volumes:
	@docker volume prune -f
	@if docker volume ls -q | grep -q $(PROJECT_NAME); then \
		docker volume rm $$(docker volume ls -q | grep $(PROJECT_NAME)); \
	fi
	@echo Done

peek:
	@docker volume ls
	@docker network ls --format "table {{.Name}}\t{{.Driver}}" | grep -v -E '^(bridge|host|none|Network_Name)'
	@docker container ls -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

dev-kill:
	@$(DOCKER_COMPOSE_COMMAND) kill
	@$(DOCKER_COMPOSE_COMMAND) down

dev-rs:
	@if [ "$(RESTART_TARGET)" = "" ] || [ "$(RESTART_TARGET)" = "none" ]; then \
		echo "Error: Please specify a target (ex: make restart RESTART_TARGET=grafana)"; \
		exit 1; \
	fi
	@$(DOCKER_COMPOSE_COMMAND) kill $(RESTART_TARGET)
	@$(DOCKER_COMPOSE_COMMAND) rm -f $(RESTART_TARGET)
	@docker volume rm $$(docker volume ls -q --filter name=$(PROJECT_NAME)_$(RESTART_TARGET)) 2>/dev/null || true
	@$(DOCKER_COMPOSE_COMMAND) up -d --build $(RESTART_TARGET)

dev-cl: dev-kill clear-volumes

dev-rb: dev-kill clear-volumes up

.PHONY: up down clear-volumes peek dev-rs dev-kill dev-cl dev-rs cloudflared
