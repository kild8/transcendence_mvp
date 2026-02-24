export default {
  Friends: {
    //friends.route.js
    INVALID_FRIEND_ID: "Ungültige Freundes-ID",
    USER_NOT_FOUND: "Benutzer nicht gefunden",
    REQUEST_ALREADY_PENDING: "Anfrage steht bereits aus",
    ALREADY_FRIENDS: "Ihr seid bereits Freunde",
    INVALID_INPUT: "Ungültige Eingabe",
    REQUEST_NOT_FOUND: "Anfrage nicht gefunden",
    FRIEND_ID_REQUIRED: "Freundes-ID erforderlich",
    SERVER_ERROR: "Serverfehler"
  },
  Rooms: {
    //rooms.route.js
    ROOM_TYPE_REQUIRED: "Raumtyp erforderlich",
    HOST_REQUIRED: "Host erforderlich",
    //roomStore.js
    NO_HOST: "Kein Host angegeben",
    OLD_ROOM_DELETED: "Vorheriger Raum gelöscht",
    USER_NOT_IN_ROOM: "Benutzer ist in keinem Raum",
    ROOM_NOT_FOUND: "Raum nicht gefunden"
  },
  Server: {
    //server.js
    UNAUTHORIZED: "Nicht autorisiert",
    NAME_EMAIL_PASSWORD_REQUIRED: "Name, Email und Passwort erforderlich",
    INVALID_EMAIL_FORMAT: "Ungültiges E-Mail-Format",
    PASSWORD_TOO_SHORT: "Passwort muss mindestens 8 Zeichen lang sein",
    EMAIL_ALREADY_IN_USE: "Email bereits verwendet",
    NAME_ALREADY_IN_USE: "Name bereits verwendet",
    USER_OR_EMAIL_IN_USE: "Name oder Email bereits verwendet",
    INVALID_CREDENTIALS: "Ungültige Zugangsdaten",
    NO_CODE: "Kein Code angegeben",
    TOKEN_ERROR: "Token-Fehler",
    SERVER_ERROR: "Serverfehler",
    INVALID_PLAYERS_ARRAY: "Ungültiges Spieler-Array (min 2)",
    NAME_REQUIRED: "Name erforderlich",
    USER_NOT_FOUND: "Benutzer nicht gefunden",
    IDENTIFIER_PASSWORD_REQUIRED: "Kennung und Passwort erforderlich",
    AVATAR_MISSING: "Avatar fehlt",
    UPLOAD_ERROR: "Fehler beim Hochladen des Avatars",
    INVALID_MATCH_DATA: "Ungültige Spieldaten",
    UNAUTHORIZED_WS: "WS nicht autorisiert"
},
WS: {
    //ws.js
    ROOM_NOT_FOUND: "Raum nicht gefunden",
    ALREADY_IN_ROOM: "Du bist bereits in diesem Raum",
    ROOM_FULL: "Raum voll",
    ONLY_HOST_CAN_START: "Nur der Raum-Ersteller kann das Spiel starten",
    TOURNAMENT_ALREADY_STARTED: "Turnier läuft bereits",
    NEED_MIN_2_PLAYERS: "Mindestens 2 Spieler erforderlich, um das Turnier zu starten",
    PLAYER_DISCONNECTED_WAITING: "Warten auf die Rückkehr des Spielers",
    MATCH_NOT_SAVED_MISSING_PLAYER: "Spiel nicht gespeichert: fehlender Spieler",
},
  ADD_USER: {
    //add-user.ts
      NAME_PLACEHOLDER: "Benutzername",
      EMAIL_PLACEHOLDER: "E-Mail",
      BUTTON_ADD: "Hinzufügen",
      BUTTON_BACK: "Zurück",
      MSG_NAME_EMAIL_REQUIRED: "Name und E-Mail erforderlich",
      MSG_USER_ADDED: "Benutzer hinzugefügt: {name} ({email})",
      MSG_ERROR: "Fehler: {error}",
      MSG_NETWORK_ERROR: "Netzwerkfehler: {error}"
    },
    Home: {
      //home.ts
    BTN_VERSUS: "Lokales Duell",
    BTN_TOURNAMENT: "Lokales Turnier",
    BTN_ONLINE: "Online"
  },
    ListUsers: {
    //list-users.ts
    BTN_BACK: "← Zurück",
    FETCH_ERROR: "Fehler beim Laden der Nutzer: {error}"
  },
  Login: {
    //login.ts
    TITLE: "Anmeldung",
    PLACEHOLDER_IDENTIFIER: "E-Mail oder Benutzername",
    PLACEHOLDER_PASSWORD: "Passwort",
    BTN_LOGIN: "Einloggen",
    BTN_GOOGLE: "↪ Mit Google anmelden",
    BTN_REGISTER: "Konto erstellen",
    ERROR_LOGIN_FAILED: "Anmeldung fehlgeschlagen",
    ERROR_NETWORK: "Netzwerkfehler"
  },
    Online: {
    //online.ts
    TITLE: "Online-Räume",
    CREATE_1V1: "1v1 erstellen",
    CREATE_TOURNAMENT: "Turnier erstellen",
    AVAILABLE_ROOMS: "Verfügbare Räume",
    BACK: "← Zurück",
    WAITING_FOR_HOST: "Warte auf Gastgeber...",
    MATCH_OVER: "Spiel beendet!",
    VICTORY: "🏆 Glückwunsch! 🏆",
    PLAYER_DISCONNECTED: "{pseudo} hat die Verbindung getrennt. Wiederverbindung möglich in {timeout} s",
    PLAYER_RECONNECTED: "{pseudo} hat sich wieder verbunden!",
    JOIN: "Beitreten",
    PLAYERS_IN_ROOM: "Spieler im Raum: {players}",
    TOURNAMENT_STARTED: "Turnier gestartet! Spieler: {players}",
    NEXT_MATCH: "Nächstes Spiel: {p1} vs {p2}",
    ERROR_CREATE_ROOM: "Fehler beim Erstellen des Raums",
    ERROR_PSEUDO_MISSING: "Benutzername fehlt, bitte erneut verbinden."
  },
    Profile: {
    //profile.ts
    TITLE: "Profil",
    CHANGE_AVATAR: "Avatar ändern",
    NEW_NAME_PLACEHOLDER: "Neuer Benutzername",
    SAVE: "Speichern",
    CANCEL: "Abbrechen",
    EDIT: "Bearbeiten",
    EMAIL: "Email",
    ADDED_ON: "Hinzugefügt am: {date}",
    WINS_LOSSES: "{wins} Sieg(e) | {losses} Niederlage(n)",
    SHOW_HISTORY: "Verlauf anzeigen",
    BACK: "← Zurück",
    FRIENDS: "Freunde",
    SEARCH_USER_PLACEHOLDER: "Benutzer nach Benutzernamen suchen",
    SEARCH: "Suchen",
    REQUESTS: "Anfragen",
    USER_NOT_FOUND: "Benutzer nicht gefunden",
    ADD: "Hinzufügen",
    REQUEST_SENT: "Anfrage gesendet ✔️",
    ERROR: "Fehler: {error}",
    NETWORK_ERROR: "Netzwerkfehler",
    USER_NOT_LOADED: "Benutzer nicht geladen",
    IMAGE_REQUIRED: "Wähle ein Bild",
    UPLOAD_IN_PROGRESS: "Upload läuft...",
    AVATAR_UPDATED: "Avatar aktualisiert ✔️",
    NAME_EMPTY: "Benutzername darf nicht leer sein",
    NAME_UPDATED: "Benutzername aktualisiert ✔️",
    HISTORY_LOADING: "Wird geladen...",
    NO_MATCHES: "Keine Spiele gefunden",
    HISTORY_LOAD_ERROR: "Fehler beim Laden des Verlaufs",
    ACCEPT: "Akzeptieren",
    REJECT: "Ablehnen"
  },
  Register: {
    //register.ts
    TITLE: "Account erstellen",
    NAME_PLACEHOLDER: "Benutzername",
    EMAIL_PLACEHOLDER: "Email",
    PASSWORD_PLACEHOLDER: "Passwort (8+ Zeichen)",
    BUTTON_CREATE: "Account erstellen",
    BUTTON_BACK_LOGIN: "← Zurück zum Login",
    ERROR_REGISTRATION: "Registrierung fehlgeschlagen",
    NETWORK_ERROR: "Netzwerkfehler"
  },
  Tournament: {
    //tournament.ts
    TITLE: "Turnier (max. {maxPlayers} Spieler)",
    BACK: "← Zurück",
    SLOT: "Platz {number}",
    PLAYER_PLACEHOLDER: "Benutzername #{number}",
    BUTTON_FILL: "Beispiele füllen",
    BUTTON_CLEAR: "Leeren",
    READY_COUNT: "Bereite Spieler: {count}",
    BUTTON_START: "Starten",
    MIN_PLAYERS_ALERT: "Mindestens 2 Spieler sind erforderlich, um ein Turnier zu starten.",
    MIN_PLAYERS_START: "Mindestens 2 Spieler"
  },
    Versus: {
    //versus.ts
    TITLE: "Duell (2 Spieler)",
    BACK: "← Zurück",
    PLAYER1: "Spieler 1",
    PLAYER2: "Spieler 2",
    PLAYER1_PLACEHOLDER: "Spieler 1 Name",
    PLAYER2_PLACEHOLDER: "Spieler 2 Name",
    BUTTON_RANDOM: "Zufällig füllen",
    BUTTON_START: "Starten",
    ERROR_PSEUDOS: "Namen müssen unterschiedlich und nicht leer sein",
    BACK_TO_MENU: "← Zurück zum Menü"
  },
    RenderTournament: {
    //render-tournament.ts
    TITLE_TOURNAMENT: "Turnier",
    BACK: "← Zurück",
    MIN_PLAYERS_ALERT: "Mindestens 2 Spieler für ein Turnier erforderlich.",
    GAME_MISSING: "Game.js fehlt.",
    ROUND_HEADER: "Runde",
    NEXT_MATCH: "Nächstes Spiel",
    START_MATCH: "Spiel starten",
    BACK_PREMATCH: "Zurück",
    VICTORY: "Sieg von",
    NEXT_MATCH_BTN: "Nächstes Spiel",
    ODD_PLAYER_ADVANCE: "rückt automatisch vor (ungerader Spieler)",
    CHAMPION_TITLE: "Turniersieger",
    CHAMPION_MSG: "hat das Turnier gewonnen!",
    TO_HOME: "Zurück zum Menü"
  },
    RenderVictory: {
    //render-victory.ts
    TITLE: "Sieg",
    WON_AGAINST: "hat gewonnen gegen",
    REPLAY: "Nochmal spielen",
    BACK_MENU: "Zurück zum Menü",
    GAME_MISSING: "Das Spiel wurde nicht geladen (Game.js fehlt)."
  },
    Renderer: {
    //renderer.ts
    APP_TITLE: "Transcendence PONG",
    HELLO: "Hallo,",
    PROFILE: "Profil",
    LOGOUT: "Abmelden",
    USER: "Benutzer"
  },
    Game: {
    //Game.ts
    GO: "START",
    WIN_ALERT: "{winner} hat gegen {loser} gewonnen — {score}"
  },
    GameLan: {
    //GameLan.ts
    GO: "START"
  }

};
