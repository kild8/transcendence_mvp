# 🏓 ft_transcendence - The Mighty Pong Contest

## 📝 Description
This project is the final stage of the 42 Common Core. It consists of a web platform for the legendary Pong contest, featuring real-time multiplayer capabilities, tournament management, and a robust monitoring infrastructure.

## 🚀 Getting Started

The project is fully containerized using **Docker**. Everything is launched with a single command line to ensure an autonomous environment.

### 1. Prerequisites: Google OIDC Secrets
To enable authentication via Google, you must set up your credentials at the root of the repository:
1. Create a folder named `secrets`.
2. Add the following two files:
   - `secrets/google_auth_client_id.txt` (containing your Google Client ID)
   - `secrets/google_auth_secret_id.txt` (containing your Google Client Secret)

### 2. Deployment Commands
* **Start the project:** `make up`
* **Stop the project:** `make down`

---

## 🌐 Infrastructure & Services

Once the containers are running, the following services are accessible via **localhost**:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | [https://localhost](https://localhost) | Main Single-Page Application (SPA). |
| **Grafana** | [https://localhost/grafana](https://localhost/grafana) | Real-time system monitoring dashboard. |
| **Kibana** | [https://localhost/kibana](https://localhost/kibana) | Log visualization and analysis (ELK Stack). |
| **Vault** | [https://localhost/vault](https://localhost/vault) | Secure secret management and OIDC authority. |

> **⚠️ Important:** On the first launch, **HashiCorp Vault** automatically generates access credentials. You can find the Root Token, Unseal keys, and monitoring admin accounts in the `vault_access/` folder at the root of the project.

---

## 🛠️ Technical Stack

This project adheres to the specific technical constraints defined in the subject:

* **Frontend:** Built as a **Single-Page Application (SPA)** using **TypeScript** and **Tailwind CSS**.
* **Backend:** Developed with the **Fastify (Node.js)** framework.
* **Database:** Data persistence managed via **SQLite**.
* **DevOps & Monitoring:**
    * Infrastructure setup for log management using the **ELK Stack** (Elasticsearch, Logstash, Kibana).
    * System health and metrics monitoring with **Prometheus and Grafana**.
* **Security:**
    * Secrets (API keys, credentials, env variables) managed by **HashiCorp Vault**.
    * Protection against SQL injections and XSS attacks.
    * All connections secured via **httpsS**.

---

## 🎮 Core Features

* **Local Pong Game:** Play live Pong games against another player on the same keyboard.
* **Tournament System:** Organize contests where multiple players register their aliases and compete in a structured matchmaking system.
* **User Profiles:** Track stats such as wins, losses, and match history.
* **Responsive Design:** Fully compatible with the latest version of Mozilla Firefox.