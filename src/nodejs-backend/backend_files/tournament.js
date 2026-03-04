//set up the tournament parameters

function createTournament(host, players = []) {
  return {
    host,
    players: [...players],
    matches: [],
    nextRound: [],
    currentMatchIndex: 0,
    round: 1,
    started: false,
    inProgress: true
  };
}

// generate the matches with the remaining players, randomly
function generateMatches(tournament) {
  // set the players and matches arrays
  // ... is the seperation operator, it means it gets the element of the array separated and not in one block, useful for copying and not moving the original
  const players = [...tournament.players];
  const matches = [];

  // shuffle the players to pick them randomly
  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }
  //filling the players into the matches array
  while (players.length >= 2) {
    matches.push({ p1: players.shift(), p2: players.shift() });
  }

  // reset matches and nextRound for this generation
  tournament.matches = matches;
  tournament.currentMatchIndex = 0;
  tournament.nextRound = [];

  // if the number is odd, they advance automatically to next round
  if (players.length === 1) {
    tournament.nextRound.push(players[0]);
  }

  console.log("Matches generated:", tournament.matches, "Next round:", tournament.nextRound);
}

// get the next match of the tournament
function getNextMatch(tournament) {
  if (!tournament.matches || tournament.currentMatchIndex >= tournament.matches.length) {
    return null;
  }
  return tournament.matches[tournament.currentMatchIndex++];
}

// record the winner and out it in the next round array
function recordMatchWinner(tournament, winnerPseudo) {
  tournament.nextRound.push(winnerPseudo);
}

module.exports = {
  createTournament,
  generateMatches,
  getNextMatch,
  recordMatchWinner
};
