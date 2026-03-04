declare global {
  interface PresenceClient {
    socket?: WebSocket;
    close?: () => void;
  }
  interface Window {
    __presenceClient?: PresenceClient | null;
    PongGame?: any; // constructor for the Game class
    state?: Record<string, any> | undefined;
  }
  export {};
}
