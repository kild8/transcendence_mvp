# 🏓 ft_transcendence - The Mighty Pong Contest

## 📝 Description
This project is the final stage of the 42 Common Core. It consists of a web platform for the legendary Pong contest, featuring real-time multiplayer capabilities, tournament management, and a robust monitoring infrastructure.

The application is exposed publicly through a **Cloudflare Tunnel**, which automatically generates a secure HTTPS URL at startup.

---

## 🚀 Getting Started

The project is fully containerized using **Docker**. Everything is launched with a single command line to ensure an autonomous and reproducible environment.

---

### 1. Prerequisites: Secrets & API Keys

To enable authentication and alerting, you must set up your credentials in the `secrets` folder at the root of the repository:

1. Create a folder named `secrets`.
2. Add the following files:
   - `secrets/google_auth_client_id.txt` (containing your Google Client ID)
   - `secrets/google_auth_secret_id.txt` (containing your Google Client Secret)
   - `secrets/discord_webhook_url.txt` (containing your Discord Webhook URL for Prometheus alerts)

---

### 2. Deployment Commands

* **Start the project:**
  ```bash
  make up
  ```

* **Stop the project:**
  ```bash
  make down
  ```

---

## 🌍 Public Access (Cloudflare Tunnel)

This project does **not** rely on `localhost` for access.

When the stack starts, a **Cloudflare Tunnel** is automatically created.  
Cloudflare generates a **public HTTPS URL dynamically**.

The generated URL is automatically written to:

```
tunnel_url
```

### 🔎 How to access the project

After running:

```bash
make up
```

Open the file:

```
tunnel_url.txt
```

Example:

```
https://random-generated-name.trycloudflare.com
```

This is the base URL of your project.

---

## 🌐 Infrastructure & Services

All services are accessible via the **generated Cloudflare URL**:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Web Application** | `https://<generated-url>` | Main Single-Page Application (SPA). |
| **Grafana** | `https://<generated-url>/grafana` | Real-time system monitoring dashboard. |
| **Vault** | `https://<generated-url>/vault` | Secure secret management and OIDC authority. |

> ⚠️ Replace `<generated-url>` with the value found inside the `tunnel_url` file.

---

## 🔐 Vault Initialization

On the first launch, **HashiCorp Vault** automatically generates:

- Root Token
- Unseal Keys
- Monitoring admin credentials

These credentials are stored in:

```
vault_access/
```

at the root of the project.

⚠️ **Important:**  
Keep these credentials secure. They are required to unseal Vault and manage secrets.

---

## 🏗️ Network Architecture

```
Internet
   ↓
Cloudflare Edge
   ↓
Cloudflare Tunnel (cloudflared container)
   ↓
Nginx Reverse Proxy
   ↓
Backend / Grafana / Vault
```

- The tunnel maintains an **outbound-only secure connection**.
- No ports need to be opened on the host machine.
- All traffic is encrypted via HTTPS.

---

## 🛠️ Technical Stack

This project adheres to the specific technical constraints defined in the subject:

* **Frontend:** Built as a **Single-Page Application (SPA)** using **TypeScript** and **Tailwind CSS**.
* **Backend:** Developed with the **Fastify (Node.js)** framework.
* **Database:** Data persistence managed via **SQLite**.
* **DevOps & Monitoring:**
    * System health and metrics monitoring with **Prometheus and Grafana**.
* **Security:**
    * Secrets (API keys, credentials, env variables) managed by **HashiCorp Vault**.
    * All connections secured via HTTPS via Cloudflare.

---

## 🎮 Core Features

* **Local Pong Game:** Play live Pong games against another player on the same keyboard.
* **Tournament System:** Organize contests where multiple players register their aliases and compete in a structured matchmaking system.
* **User Profiles:** Track stats such as wins, losses, and match history.
* **Responsive Design:** Fully compatible with the latest version of Mozilla Firefox.