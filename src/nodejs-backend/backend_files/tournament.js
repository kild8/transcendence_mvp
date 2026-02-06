function createTournament(host, players = []) {
  return {
    host,
    players: [...players],     // tous les joueurs
    matches: [],               // tableau de matchs {p1, p2}
    nextRound: [],             // joueurs qualifiés pour le tour suivant
    currentMatchIndex: 0,
    started: false,
    inProgress: true
  };
}

// Génère les matchs du tournoi à partir des joueurs restants
function generateMatches(tournament) {
  const players = [...tournament.players];
  const matches = [];

  while (players.length >= 2) {
    matches.push({ p1: players.shift(), p2: players.shift() });
  }

  tournament.matches = matches;
  tournament.currentMatchIndex = 0;

  // Si un joueur est seul, il passe automatiquement au nextRound
  if (players.length === 1) {
    tournament.nextRound.push(players[0]);
  }

  console.log("Matches generated:", tournament.matches, "Next round:", tournament.nextRound);
}

// Renvoie le prochain match à jouer
function getNextMatch(tournament) {
  if (!tournament.matches || tournament.currentMatchIndex >= tournament.matches.length) {
    // S'il n'y a plus de matchs, prépare le tour suivant
    if (tournament.nextRound.length > 0) {
      tournament.players = [...tournament.nextRound];
      tournament.nextRound = [];
      generateMatches(tournament);
      if (tournament.matches.length === 0) return null;
    } else {
      return null; // tournoi terminé
    }
  }
  return tournament.matches[tournament.currentMatchIndex++];
}

// Enregistre le gagnant d’un match et le met dans le nextRound
function recordMatchWinner(tournament, winnerPseudo) {
  tournament.nextRound.push(winnerPseudo);
}

module.exports = {
  createTournament,
  generateMatches,
  getNextMatch,
  recordMatchWinner
};
