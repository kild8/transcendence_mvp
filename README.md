# 🏓 ft_transcendence - The Mighty Pong Contest

## 📝 Description
[cite_start]This project is the final stage of the 42 Common Core[cite: 16]. [cite_start]It consists of a web platform for the legendary Pong contest, featuring real-time multiplayer capabilities, tournament management, and a robust monitoring infrastructure[cite: 84, 87, 130].

## 🚀 Getting Started

[cite_start]The project is fully containerized using **Docker**[cite: 115]. [cite_start]Everything is launched with a single command line to ensure an autonomous environment[cite: 115].

### 1. Prerequisites: Google OIDC Secrets
To enable authentication via Google, you must set up your credentials at the root of the repository:
1. Create a folder named `secrets`.
2. Add the following two files:
   - `secrets/google_auth_client_id.txt` (containing your Google Client ID).
   - `secrets/google_auth_secret_id.txt` (containing your Google Client Secret).

### 2. Deployment Commands
* **Start the project:** `make up`
* **Stop the project:** `make down`

---

## 🌐 Infrastructure & Services

Once the containers are running, the following services are accessible via **localhost**:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | [https://localhost](https://localhost) | [cite_start]Main Single-Page Application (SPA)[cite: 111]. |
| **Grafana** | [https://localhost/grafana](https://localhost/grafana) | [cite_start]Real-time system monitoring dashboard[cite: 331, 334]. |
| **Kibana** | [https://localhost/kibana](https://localhost/kibana) | [cite_start]Log visualization and analysis (ELK Stack)[cite: 323, 327]. |
| **Vault** | [https://localhost/vault](https://localhost/vault) | [cite_start]Secure secret management and OIDC authority[cite: 297]. |

> **⚠️ Important:** On the first launch, **HashiCorp Vault** automatically generates access credentials. You can find the Root Token, Unseal keys, and monitoring admin accounts in the `vault_access/` folder at the root of the project.

---

## 🛠️ Technical Stack

[cite_start]This project adheres to the specific technical constraints defined in the subject[cite: 21, 101]:

* [cite_start]**Frontend:** Built as a **Single-Page Application (SPA)** [cite: 111] [cite_start]using **TypeScript** [cite: 109] [cite_start]and **Tailwind CSS**[cite: 199].
* [cite_start]**Backend:** Developed with the **Fastify (Node.js)** framework[cite: 195].
* [cite_start]**Database:** Data persistence managed via **SQLite**[cite: 203].
* **DevOps & Monitoring:**
    * [cite_start]Infrastructure setup for log management using the **ELK Stack** (Elasticsearch, Logstash, Kibana)[cite: 323].
    * [cite_start]System health and metrics monitoring with **Prometheus and Grafana**[cite: 331].
* **Security:**
    * [cite_start]Secrets (API keys, credentials, env variables) managed by **HashiCorp Vault**[cite: 297].
    * [cite_start]Protection against SQL injections and XSS attacks[cite: 159].
    * [cite_start]All connections secured via **HTTPS**[cite: 160].

---

## 🎮 Core Features

* [cite_start]**Local Pong Game:** Play live Pong games against another player on the same keyboard[cite: 128, 129].
* [cite_start]**Tournament System:** Organize contests where multiple players register their aliases and compete in a structured matchmaking system[cite: 130, 133, 138].
* [cite_start]**User Profiles:** Track stats such as wins, losses, and match history[cite: 226, 227].
* [cite_start]**Responsive Design:** Fully compatible with the latest version of Mozilla Firefox[cite: 112].