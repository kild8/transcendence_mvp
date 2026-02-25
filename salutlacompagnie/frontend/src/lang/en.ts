export default {
  Friends: {
    //friends.route.js
    INVALID_FRIEND_ID: "Invalid friend_id",
    USER_NOT_FOUND: "User not found",
    REQUEST_ALREADY_PENDING: "Request already pending",
    ALREADY_FRIENDS: "Already friends",
    INVALID_INPUT: "Invalid input",
    REQUEST_NOT_FOUND: "Request not found",
    FRIEND_ID_REQUIRED: "friend_id required",
    SERVER_ERROR: "Server error"
  },
  Rooms: {
    //rooms.route.js
    ROOM_TYPE_REQUIRED: "Room type required",
    HOST_REQUIRED: "Host required",
    //roomStore.js
    NO_HOST: "No host provided",
    },

    Server: {
        //server.js
        UNAUTHORIZED: "Unauthorized",
        NAME_EMAIL_PASSWORD_REQUIRED: "Name, email and password are required",
        INVALID_EMAIL_FORMAT: "Invalid email format",
        PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
        EMAIL_ALREADY_IN_USE: "Email already in use",
        NAME_ALREADY_IN_USE: "Name already in use",
        USER_OR_EMAIL_IN_USE: "User or email already exists",
        INVALID_CREDENTIALS: "Invalid credentials",
        NO_CODE: "No code provided",
        TOKEN_ERROR: "Token error",
        SERVER_ERROR: "Server error",
        INVALID_PLAYERS_ARRAY: "Invalid players array (min 2)",
        NAME_REQUIRED: "Name required",
        USER_NOT_FOUND: "User not found",
        IDENTIFIER_PASSWORD_REQUIRED: "Identifier and password are required",
        AVATAR_MISSING: "Avatar missing",
        UPLOAD_ERROR: "Error uploading avatar",
        INVALID_MATCH_DATA: "Invalid match data",
        UNAUTHORIZED_WS: "Unauthorized WS"
    },
    WS: {
        //ws.js
        ROOM_NOT_FOUND: "Room not found",
        ALREADY_IN_ROOM: "You are already in this room",
        ROOM_FULL: "Room is full",
        ONLY_HOST_CAN_START: "Only the room creator can start the game",
        TOURNAMENT_ALREADY_STARTED: "The tournament is already in progress",
        NEED_MIN_2_PLAYERS: "At least 2 players are required to start the tournament",
        PLAYER_DISCONNECTED_WAITING: "Waiting for reconnection of {pseudo}",
    },
    ADD_USER: {
      //add-user.ts
      NAME_PLACEHOLDER: "User name",
      EMAIL_PLACEHOLDER: "Email",
      BUTTON_ADD: "Add",
      BUTTON_BACK: "Back",
      MSG_NAME_EMAIL_REQUIRED: "Name and email required",
      MSG_USER_ADDED: "User added: {name} ({email})",
      MSG_ERROR: "Error: {error}",
      MSG_NETWORK_ERROR: "Network error: {error}"
    },
    Home: {
    //home.ts
    BTN_VERSUS: "Local Versus",
    BTN_TOURNAMENT: "Local Tournament",
    BTN_ONLINE: "Online"
  },
    ListUsers: {
    //list-users.ts
    BTN_BACK: "← Back",
    FETCH_ERROR: "Error fetching users: {error}"
  },
    Login: {
    //login.ts
    TITLE: "Login",
    PLACEHOLDER_IDENTIFIER: "Email or username",
    PLACEHOLDER_PASSWORD: "Password",
    BTN_LOGIN: "Log in",
    BTN_GOOGLE: "↪ Log in with Google",
    BTN_REGISTER: "Create account",
    ERROR_LOGIN_FAILED: "Login failed",
    ERROR_NETWORK: "Network error"
  },
    Online: {
    //online.ts
    TITLE: "Online Rooms",
    CREATE_1V1: "Create 1v1",
    CREATE_TOURNAMENT: "Create Tournament",
    AVAILABLE_ROOMS: "Available Rooms",
    BACK: "← Back",
    ERROR_PSEUDO_FETCH: "Unable to retrieve your username. Please log in again.",
    WAITING_FOR_HOST: "Waiting for host...",
    MATCH_OVER: "Match over!",
    VICTORY: "🏆 Congratulations! 🏆",
    PLAYER_DISCONNECTED: "{pseudo} disconnected. Reconnection possible in {timeout} s",
    PLAYER_RECONNECTED: "{pseudo} reconnected!",
    JOIN: "Join",
    PLAYERS_IN_ROOM: "Players in room: {players}",
    TOURNAMENT_STARTED: "Tournament started! Players: {players}",
    NEXT_MATCH: "Next match: {p1} vs {p2}",
    ERROR_CREATE_ROOM: "Error creating room",
    ERROR_PSEUDO_MISSING: "Missing username, please reconnect."
  },
    Profile: {
    //profile.ts
    TITLE: "Profile",
    CHANGE_AVATAR: "Change Avatar",
    NEW_NAME_PLACEHOLDER: "New username",
    LANGUAGE: "Language",
    SAVE: "Save",
    CANCEL: "Cancel",
    REMOVE: "Remove",
    EDIT: "Edit",
    EMAIL: "Email",
    ADDED_ON: "Added on: {date}",
    WINS_LOSSES: "{wins} win(s) | {losses} lose(s)",
    SHOW_HISTORY: "Show history",
    BACK: "← Back",
    FRIENDS: "Friends",
    SEARCH_USER_PLACEHOLDER: "Search user by username",
    SEARCH: "Search",
    SEARCHING: "Searching...",
    REQUESTS: "Requests",
    USER_NOT_FOUND: "User not found",
    ADD: "Add",
    INCOMING_REQUESTS: "Incoming requests",
    REQUEST_SENT: "Request sent ✔️",
    ERROR: "Error: {error}",
    NETWORK_ERROR: "Network error",
    USER_NOT_LOADED: "User not loaded",
    IMAGE_REQUIRED: "Choose an image",
    UPLOAD_IN_PROGRESS: "Upload in progress...",
    UPLOAD_FAILED: "Upload failed",
    SERVER_ERROR: "Server error",
    AVATAR_UPDATED: "Avatar updated ✔️",
    NAME_EMPTY: "Username cannot be empty",
    NAME_UPDATED: "Username updated ✔️",
    NAME_UPDATE_FAIL: "Error updating name",
    MATCH_HISTORY: "Match history",
    HISTORY_LOADING: "Loading...",
    NO_MATCHES: "No matches found",
    HISTORY_LOAD_ERROR: "Error loading history",
    ACCEPT: "Accept",
    REJECT: "Reject",
    LANG_SAVING: "Saving…",
    LANG_SAVE_ERROR: "Error saving",
    LANG_SAVED: "Language updated ✔️"
  },
    Register: {
    //register.ts
    TITLE: "Create an account",
    NAME_PLACEHOLDER: "Username",
    EMAIL_PLACEHOLDER: "Email",
    PASSWORD_PLACEHOLDER: "Password (8+ characters)",
    BUTTON_CREATE: "Create account",
    BUTTON_BACK_LOGIN: "← Back to login",
    ERROR_REGISTRATION: "Registration failed",
    NETWORK_ERROR: "Network error"
  },
    Tournament: {
    //tournament.ts
    TITLE: "Tournament (max {maxPlayers} players)",
    BACK: "← Back",
    SLOT: "Slot {number}",
    PLAYER_PLACEHOLDER: "Username #{number}",
    BUTTON_FILL: "Fill examples",
    BUTTON_CLEAR: "Clear",
    READY_COUNT: "Players ready: {count}",
    BUTTON_START: "Start",
    MIN_PLAYERS_ALERT: "At least 2 players are required to start a tournament.",
    MIN_PLAYERS_START: "At least 2 players"
  },
    Versus: {
    //versus.ts
    TITLE: "Versus (2 players)",
    BACK: "← Back",
    PLAYER1: "Player 1",
    PLAYER2: "Player 2",
    PLAYER1_PLACEHOLDER: "Player 1 username",
    PLAYER2_PLACEHOLDER: "Player 2 username",
    BUTTON_RANDOM: "Random fill",
    BUTTON_START: "Start",
    ERROR_PSEUDOS: "Usernames must be different and not empty",
    BACK_TO_MENU: "← Back to menu",
    NOT_LOADED: "The game has not been loaded."
  },
    RenderTournament: {
    //render-tournament.ts
    TITLE_TOURNAMENT: "Tournament",
    BACK: "← Back",
    MIN_PLAYERS_ALERT: "At least 2 players are required for a tournament.",
    GAME_MISSING: "Game.js missing.",
    ROUND_HEADER: "Round {round} — {players} players",
    NEXT_MATCH: "Next match",
    START_MATCH: "Start match",
    BACK_PREMATCH: "Back",
    VICTORY: "Victory of",
    NEXT_MATCH_BTN: "Next match",
    ODD_PLAYER_ADVANCE: "{player} advances automatically (odd player)",
    CHAMPION_TITLE: "Tournament Champion",
    CHAMPION_MSG: "won the tournament!",
    TO_HOME: "Back to menu"
  },
    RenderVictory: {
    //render-victory.ts
    TITLE: "Victory",
    WON_AGAINST: "won against",
    REPLAY: "Replay",
    BACK_MENU: "Back to menu",
    GAME_MISSING: "The game has not been loaded (Game.js missing)."
  },
    Renderer: {
    //renderer.ts
    HELLO: "Hello,",
    PROFILE: "Profile",
    LOGOUT: "Logout",
    USER: "User"
  },
    Game: {
    //Game.ts
    GO: "GO",
    PLAYER1: "Player 1",
    PLAYER2: "Player 2",
    WIN_ALERT: "{winner} won against {loser} — {score}"
  },
    GameLan: {
    //GameLan.ts
    GO: "GO"
  }

};
