# 🏓 ft_transcendence - The Mighty Pong Contest

## 📝 Description
This project is the final stage of the 42 Common Core. It consists of a web platform for the legendary Pong contest, featuring real-time multiplayer capabilities, tournament management, and a robust monitoring infrastructure.

The application is exposed publicly through a **Cloudflare Tunnel**, which automatically generates a secure HTTPS URL at startup.

---

## 🚀 Getting Started

The project is fully containerized using **Docker**. Everything is launched with command lines to ensure an autonomous and reproducible environment.

---

## ⚠️ IMPORTANT — Cloudflare Tunnel & Google OAuth Setup (FIRST STEP)

Before launching the full project, you MUST first generate the public HTTPS URL via Cloudflare.

### 1️⃣ Start Cloudflare Tunnel Only

```bash
make cloud-up
```

This will start the `cloudflared` container and generate a public HTTPS URL.

The generated URL is automatically written to:

```
tunnel_url.txt
```

Example:

```
https://random-generated-name.trycloudflare.com
```

---

### 2️⃣ Create the Google OAuth Credentials

Once you have the generated URL, you must configure your Google OAuth application using this exact URL.

Go to the Google Cloud Console and create OAuth 2.0 credentials.

Configure:

#### ✅ Authorized JavaScript origins
```
https://your-generated-url.trycloudflare.com
```

#### ✅ Authorized redirect URI
```
https://your-generated-url.trycloudflare.com/api/auth/google/callback
```

⚠️ Replace `your-generated-url.trycloudflare.com` with the exact value found in `tunnel_url.txt`.

---

### 3️⃣ Create the `secrets` Folder

At the root of the repository:

```bash
mkdir secrets
```

Add the following files:

- `secrets/google_auth_client_id.txt`  
  → containing your Google Client ID

- `secrets/google_auth_secret_id.txt`  
  → containing your Google Client Secret

- `secrets/discord_webhook_url.txt`  
  → containing your Discord Webhook URL (for Prometheus alerts)

---

## 🚀 Full Deployment

Once everything above is configured:

### Start the project

```bash
make up
```

### Stop the project

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
/tunnel_url/tunnel_url.txt
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

> ⚠️ Replace `<generated-url>` with the value found inside the `tunnel_url.txt` file.

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

- **Frontend:** Single-Page Application (SPA) using **TypeScript** and **Tailwind CSS**  
- **Backend:** **Fastify (Node.js)**  
- **Database:** **SQLite**  
- **DevOps & Monitoring:** **Prometheus + Grafana**  
- **Security:**  
  - Secrets managed by **HashiCorp Vault**  
  - HTTPS secured via **Cloudflare Tunnel**

---

## 🎮 Core Features

- **Local Pong Game:** Play live Pong games against another player on the same keyboard.  
- **Tournament System:** Structured matchmaking system with player aliases.  
- **User Profiles:** Track wins, losses, and match history.  
- **Responsive Design:** Fully compatible with the latest version of Mozilla Firefox.