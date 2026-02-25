export const state = {
  currentGame: null as any,
  appState: {
    players: [] as string[],
    mode: "LOCAL" as "LOCAL" | "LAN",
    ws: null as WebSocket | null,
    playerRole: null as "player1" | "player2" | null,

    //for AUTH
    currentUser: null as null | {
      id: number;
      name: string;
      email: string;
      avatar: string;
      language: string;
      language_session?: string;
    }

  },
  WINNING_SCORE: 2,
  MAX_TOURNAMENT_PLAYERS: 8,
  
  // getter pour la langue actuelle
  get lang(): "en" | "fr" | "de" {
    // prefer language_session (temporary / UI preference from header), fall back to persisted user.language, then 'en'
    const cs = this.appState.currentUser as any;
    const l = (cs?.language_session || cs?.language) as "en" | "fr" | "de" | undefined;
    return l || 'en';
  }
};
