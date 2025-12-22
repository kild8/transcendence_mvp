export const state = {
  currentGame: null as any,
  appState: {
    players: [] as string[],
    mode: "LOCAL" as "LOCAL" | "LAN",
    ws: null as WebSocket | null,
    playerRole: null as "player1" | "player2" | null,
  },
  WINNING_SCORE: 2,
  MAX_TOURNAMENT_PLAYERS: 8
};
