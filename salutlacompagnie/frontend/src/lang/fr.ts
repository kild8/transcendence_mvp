export default {
  Friends: {
    //friends.route.js
    INVALID_FRIEND_ID: "ID d'ami invalide",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    REQUEST_ALREADY_PENDING: "Demande déjà en attente",
    ALREADY_FRIENDS: "Vous êtes déjà amis",
    INVALID_INPUT: "Entrée invalide",
    REQUEST_NOT_FOUND: "Demande non trouvée",
    FRIEND_ID_REQUIRED: "ID d'ami requis",
    SERVER_ERROR: "Erreur serveur"
  },
  Rooms: {
    //roooms.route.js
    ROOM_TYPE_REQUIRED: "Le type de room est requis",
    HOST_REQUIRED: "Hôte requis",
    //roomStore.js
    NO_HOST: "Aucun hôte fourni",
    OLD_ROOM_DELETED: "Ancienne salle supprimée",
    USER_NOT_IN_ROOM: "L'utilisateur n'est dans aucune salle",
    ROOM_NOT_FOUND: "Salle non trouvée"
  },
  Server: {
    //server.js
    UNAUTHORIZED: "Non autorisé",
    NAME_EMAIL_PASSWORD_REQUIRED: "Nom, email et mot de passe requis",
    INVALID_EMAIL_FORMAT: "Format d'email invalide",
    PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères",
    EMAIL_ALREADY_IN_USE: "Email déjà utilisé",
    NAME_ALREADY_IN_USE: "Nom déjà utilisé",
    USER_OR_EMAIL_IN_USE: "Nom ou email déjà utilisé",
    INVALID_CREDENTIALS: "Identifiants invalides",
    NO_CODE: "Aucun code fourni",
    TOKEN_ERROR: "Erreur de token",
    SERVER_ERROR: "Erreur serveur",
    INVALID_PLAYERS_ARRAY: "Tableau de joueurs invalide (min 2)",
    NAME_REQUIRED: "Nom requis",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    IDENTIFIER_PASSWORD_REQUIRED: "Identifiant et mot de passe requis",
    AVATAR_MISSING: "Avatar manquant",
    UPLOAD_ERROR: "Erreur lors de l'upload de l'avatar",
    INVALID_MATCH_DATA: "Données de match invalides",
    UNAUTHORIZED_WS: "WS non autorisé"
    },
    WS: {
    //ws.js
    ROOM_NOT_FOUND: "Room introuvable",
    ALREADY_IN_ROOM: "Tu es déjà dans cette room",
    ROOM_FULL: "Room pleine",
    ONLY_HOST_CAN_START: "Seul le créateur de la room peut lancer la partie",
    TOURNAMENT_ALREADY_STARTED: "Le tournoi est déjà en cours",
    NEED_MIN_2_PLAYERS: "Il faut au moins 2 joueurs pour démarrer le tournoi",
    PLAYER_DISCONNECTED_WAITING: "En attente de la reconnexion du joueur",
    MATCH_NOT_SAVED_MISSING_PLAYER: "Match non sauvegardé : joueur manquant",
},
    ADD_USER: {
      //add-user.ts
      NAME_PLACEHOLDER: "Nom de l'utilisateur",
      EMAIL_PLACEHOLDER: "Email",
      BUTTON_ADD: "Ajouter",
      BUTTON_BACK: "Retour",
      MSG_NAME_EMAIL_REQUIRED: "Nom et email requis",
      MSG_USER_ADDED: "Utilisateur ajouté : {name} ({email})",
      MSG_ERROR: "Erreur : {error}",
      MSG_NETWORK_ERROR: "Erreur réseau : {error}"
    },
    Home: {
    //home.ts
    BTN_VERSUS: "Versus local",
    BTN_TOURNAMENT: "Tournoi local",
    BTN_ONLINE: "En ligne"
  },
    ListUsers: {
    //list-users.ts
    BTN_BACK: "← Retour",
    FETCH_ERROR: "Erreur lors de la récupération : {error}"
  },
    Login: {
    //login.ts
    TITLE: "Connexion",
    PLACEHOLDER_IDENTIFIER: "Email ou pseudo",
    PLACEHOLDER_PASSWORD: "Mot de passe",
    BTN_LOGIN: "Se connecter",
    BTN_GOOGLE: "↪ Se connecter avec Google",
    BTN_REGISTER: "Créer un compte",
    ERROR_LOGIN_FAILED: "Connexion échouée",
    ERROR_NETWORK: "Erreur réseau"
  },
    Online: {
    //online.ts
    TITLE: "Rooms en ligne",
    CREATE_1V1: "Créer 1v1",
    CREATE_TOURNAMENT: "Créer Tournoi",
    AVAILABLE_ROOMS: "Rooms disponibles",
    BACK: "← Retour",
    ERROR_PSEUDO_FETCH: "Impossible de récupérer votre pseudo, veuillez vous reconnecter.",
    WAITING_FOR_HOST: "En attente de l'hôte...",
    MATCH_OVER: "Match terminé !",
    VICTORY: "🏆 Félicitations ! 🏆",
    PLAYER_DISCONNECTED: "{pseudo} s'est déconnecté. Reconnexion possible dans {timeout} s",
    PLAYER_RECONNECTED: "{pseudo} s'est reconnecté !",
    JOIN: "Rejoindre",
    PLAYERS_IN_ROOM: "Joueurs dans la room: {players}",
    TOURNAMENT_STARTED: "Tournoi démarré ! Joueurs : {players}",
    NEXT_MATCH: "Prochain match : {p1} vs {p2}",
    ERROR_CREATE_ROOM: "Erreur création de room",
    ERROR_PSEUDO_MISSING: "Pseudo manquant, veuillez vous reconnecter."
  },
    Profile: {
    //profile.ts
    TITLE: "Profil",
    CHANGE_AVATAR: "Changer l’avatar",
    NEW_NAME_PLACEHOLDER: "Nouveau pseudo",
    LANGUAGE: "Langue",
    SAVE: "Sauvegarder",
    REMOVE: "Supprimer",
    CANCEL: "Annuler",
    EDIT: "Modifier",
    EMAIL: "Email",
    ADDED_ON: "Ajouté le : {date}",
    WINS_LOSSES: "{wins} victoire(s) | {losses} défaite(s)",
    SHOW_HISTORY: "Afficher l'historique",
    BACK: "← Retour",
    FRIENDS: "Amis",
    SEARCH_USER_PLACEHOLDER: "Rechercher un utilisateur par pseudo",
    SEARCH: "Rechercher",
    SEARCHING: "Recherche...",
    REQUESTS: "Demandes",
    USER_NOT_FOUND: "Utilisateur non trouvé",
    ADD: "Ajouter",
    INCOMING_REQUESTS: "Demandes entrantes",
    REQUEST_SENT: "Demande envoyée ✔️",
    ERROR: "Erreur : {error}",
    NETWORK_ERROR: "Erreur réseau",
    USER_NOT_LOADED: "Utilisateur non chargé",
    IMAGE_REQUIRED: "Choisis une image",
    UPLOAD_IN_PROGRESS: "Upload en cours...",
    UPLOAD_FAILED: "Échec de l'upload",
    SERVER_ERROR: "Erreur serveur",
    AVATAR_UPDATED: "Avatar mis à jour ✔️",
    NAME_EMPTY: "Le pseudo ne peut pas être vide",
    NAME_UPDATED: "Pseudo mis à jour ✔️",
    NAME_UPDATE_FAIL: "Erreur lors de la modification",
    MATCH_HISTORY: "Historique des parties",
    HISTORY_LOADING: "Chargement...",
    NO_MATCHES: "Aucune partie trouvée",
    HISTORY_LOAD_ERROR: "Erreur lors du chargement de l'historique",
    ACCEPT: "Accepter",
    REJECT: "Refuser",
    LANG_SAVING: "En cours…",
    LANG_SAVE_ERROR: "Erreur lors de la sauvegarde",
    LANG_SAVED: "Langue mise à jour ✔️"
  },
    Register: {
    //reguster.ts
    TITLE: "Créer un compte",
    NAME_PLACEHOLDER: "Pseudo",
    EMAIL_PLACEHOLDER: "Email",
    PASSWORD_PLACEHOLDER: "Mot de passe (8+ caractères)",
    BUTTON_CREATE: "Créer le compte",
    BUTTON_BACK_LOGIN: "← Retour à la connexion",
    ERROR_REGISTRATION: "Inscription échouée",
    NETWORK_ERROR: "Erreur réseau"
  },
  Tournament: {
    //tournament.ts
    TITLE: "Tournoi (max {maxPlayers} joueurs)",
    BACK: "← Retour",
    SLOT: "Slot {number}",
    PLAYER_PLACEHOLDER: "Pseudo #{number}",
    BUTTON_FILL: "Remplir exemples",
    BUTTON_CLEAR: "Effacer",
    READY_COUNT: "Joueurs prêts: {count}",
    BUTTON_START: "Démarrer",
    MIN_PLAYERS_ALERT: "Il faut au moins 2 joueurs pour lancer un tournoi.",
    MIN_PLAYERS_START: "Il faut au moins 2 joueurs"
  },
  Versus: {
    //versus.ts
    TITLE: "Versus (2 joueurs)",
    BACK: "← Retour",
    PLAYER1: "Joueur 1",
    PLAYER2: "Joueur 2",
    PLAYER1_PLACEHOLDER: "Pseudo du joueur 1",
    PLAYER2_PLACEHOLDER: "Pseudo du joueur 2",
    BUTTON_RANDOM: "Remplir aléatoire",
    BUTTON_START: "Démarrer",
    ERROR_PSEUDOS: "Les pseudos doivent être différents et non vides",
    BACK_TO_MENU: "← Retour au menu",
    NOT_LOADED: "Le jeu n'a pas été chargé."

  },
  RenderTournament: {
    TITLE_TOURNAMENT: "Tournoi",
    BACK: "← Retour",
    MIN_PLAYERS_ALERT: "Il faut au moins 2 joueurs pour un tournoi.",
    GAME_MISSING: "Game.js manquant.",
    ROUND_HEADER: "Tour {round} — {players} joueurs",
    ROUND_OVERVIEW: "Aperçu du tour {round} — {matches} match(s)",
    NEXT_MATCH: "Prochain match",
    START_MATCH: "Commencer le match",
    START_ROUND: "Démarrer le tour",
    ODD_PLAYERS: "Joueurs exempts: {players}",
    NO_MATCHES: "Aucun match",
    BACK_PREMATCH: "Retour",
    VICTORY: "Victoire de",
    NEXT_MATCH_BTN: "Match suivant",
    ODD_PLAYER_ADVANCE: "{player} avance automatiquement (joueur impair)",
    CHAMPION_TITLE: "Champion du tournoi",
    CHAMPION_MSG: "a gagné le tournoi !",
    TO_HOME: "Retour au menu"
  },
  RenderVictory: {
    //render-victory.ts
    TITLE: "Victoire",
    WON_AGAINST: "a gagné contre",
    REPLAY: "Rejouer",
    BACK_MENU: "Retour au menu",
    GAME_MISSING: "Le jeu n'a pas été chargé (Game.js manquant)."
  },
  Renderer: {
    //renderer.ts
    APP_TITLE: "Transcendence PONG",
    HELLO: "Bonjour,",
    PROFILE: "Profil",
    LOGOUT: "Se déconnecter",
    USER: "Utilisateur"
  },
  Game: {
    //Game.ts
    GO: "GO",
    PLAYER1: "Joueur 1",
    PLAYER2: "Joueur 2",
    WIN_ALERT: "{winner} a gagné contre {loser} — {score}"
  },
    GameLan: {
    //GameLan.ts
    GO: "GO"
  }

};
