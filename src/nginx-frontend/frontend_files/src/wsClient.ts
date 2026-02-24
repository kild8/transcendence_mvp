// Minimal presence WebSocket client (auto-reconnect simple)
export function createPresenceSocket(onOpen?: () => void, onClose?: (ev?: CloseEvent) => void) {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${proto}://${window.location.hostname}/ws`; // adapte si backend sur un autre host/port
  let ws: WebSocket | null = null;
  let closedByClient = false;
  let retry = 0;
  let retryTimer: any = null;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      retry = 0;
      if (onOpen) onOpen();
      // Optionnel : dire au serveur le rôle si souhaité
      try { ws?.send(JSON.stringify({ type: 'register-socket', role: 'presence' })); } catch (e) {}
    };

    ws.onmessage = (e) => {
      // On peut écouter 'presence' ou autres types si besoin dans l'app
      // Exemple: const msg = JSON.parse(e.data);
    };

    ws.onclose = (ev) => {
      ws = null;
      if (onClose) onClose(ev);
      if (!closedByClient) {
        // reconnect with backoff
        retry = Math.min(6, retry + 1);
        const wait = Math.min(30000, 500 * Math.pow(2, retry)); // exp backoff up to 30s
        retryTimer = window.setTimeout(connect, wait);
      }
    };

    ws.onerror = () => {
      // errors lead to close event, ignore here
    };
  }

  connect();

  return {
    get socket() { return ws; },
    close() {
      closedByClient = true;
      if (retryTimer) clearTimeout(retryTimer);
      try { ws?.close(); } catch (e) {}
      ws = null;
    }
  };
}

// expose a small helper on window to store the last created client
try { (window as any).__presenceClient = (window as any).__presenceClient || null; } catch (e) {}