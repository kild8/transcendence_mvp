// Minimal interface describing a runtime game instance used by pages
export interface CurrentGameInstance {
  stop?: () => void;
  // other runtime methods may exist (render, pause, etc.) but are not required here
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  language: string;
  language_session?: string;
}

export interface AppState {
  players: string[];
  mode: "LOCAL" | "LAN";
  ws: WebSocket | null;
  playerRole: "player1" | "player2" | null;
  // for auth
  currentUser: User | null;
  // optional lobby websocket (kept for compatibility with older code)
  lobbyWs?: WebSocket | null;
}

export interface State {
  currentGame: CurrentGameInstance | null;
  appState: AppState;
  WINNING_SCORE: number;
  MAX_TOURNAMENT_PLAYERS: number;
  get lang(): "en" | "fr" | "de";
}

export const state: State = {
  currentGame: null,
  appState: {
    players: [] as string[],
    mode: "LOCAL",
    ws: null,
    playerRole: null,
    currentUser: null
  },
  WINNING_SCORE: 2,
  MAX_TOURNAMENT_PLAYERS: 8,

  // getter pour la langue actuelle
  get lang(): "en" | "fr" | "de" {
    // prefer language_session (temporary / UI preference from header), fall back to persisted user.language, then 'en'
    const cs = this.appState.currentUser;
    const l = (cs?.language_session || cs?.language) as "en" | "fr" | "de" | undefined;
    return l || 'en';
  }
};
