// Minimal presence WebSocket client (auto-reconnect simple)
export function createPresenceSocket(onOpen?: () => void, onClose?: (ev?: CloseEvent) => void) {
  const url = `wss://${window.location.hostname}:8443/ws`;
  let ws: WebSocket | null = null;
  let closedByClient = false;
  let retry = 0;
  let retryTimer: number | null = null;

  function connect() {
    ws = new WebSocket(url);

    ws.onopen = () => {
      retry = 0;
      if (onOpen) onOpen();
      try { ws?.send(JSON.stringify({ type: 'register-socket', role: 'presence' })); } catch (e) {}
    };

    ws.onmessage = (e) => {
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
try { (window as unknown as Record<string, unknown>)['__presenceClient'] = (window as unknown as Record<string, unknown>)['__presenceClient'] || null; } catch (e) {}