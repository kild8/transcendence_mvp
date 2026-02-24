const promClient = require('prom-client');

promClient.collectDefaultMetrics(); // CPU, mémoire, event loop, GC…

const connectedPlayersArray = [];

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2]
});

const httpInFlight = new promClient.Gauge({
  name: 'http_requests_in_flight',
  help: 'Requests in progress',
  labelNames: ['method', 'route']
});

// const wsMessages = new promClient.Counter({
//   name: 'ws_messages_total',
//   help: 'Total WS messages',
//   labelNames: ['type']
// });

// const wsConnections = new promClient.Gauge({
//   name: 'ws_connections',
//   help: 'Number of active WebSocket connections'
// });

const totalEndedGames = new promClient.Counter({
  name: 'total_ended_games',
  help: 'Total number of played games'
});


const gamesInProgress = new promClient.Gauge({
  name: 'games_in_progress',
  help: 'Number of active games'
});

const gamesDuration = new promClient.Histogram({
  name: 'game_duration_seconds',
  help: 'Duration of games',
  buckets: [0, 10, 30, 60, 120, 240, 540]
});

const playersConnected = new promClient.Gauge({
  name: 'players_connected',
  help: 'Number of connected players'
});

const exitedGamesCounter = new promClient.Counter({
  name: 'exited_games_counter',
  help: 'Number of game that have been exited before end'
});

// const openRooms = new promClient.Gauge({
//   name: 'open_rooms',
//   help: 'Number of open rooms'
// });

const loginCounter = new promClient.Counter({
  name: 'login_counter',
  help: 'Counter of all player logins'
});

const logoutCounter = new promClient.Counter({
  name: 'logout_counter',
  help: 'Counter of all player logouts'
});

function setupMetricsHooks(fastify) {
  fastify.addHook('onRequest', async (req) => {
    httpInFlight.labels(req.method, req.routerPath || req.url).inc();
    req._startTime = process.hrtime();
  });

  fastify.addHook('onResponse', async (req, reply) => {
    const diff = process.hrtime(req._startTime);
    const duration = diff[0] + diff[1] / 1e9;

    const route = req.routerPath || req.url;

    httpRequestTotal.labels(req.method, route, reply.statusCode).inc();
    httpRequestDuration.labels(req.method, route, reply.statusCode).observe(duration);
    httpInFlight.labels(req.method, route).dec();
  });
}

module.exports = {
  promClient, 
  // wsMessages, 
  // wsConnections,
  totalEndedGames,
  gamesInProgress,
  playersConnected,
  exitedGamesCounter,
  // openRooms,
  loginCounter,
  logoutCounter,
  gamesDuration,
  connectedPlayersArray,
  setupMetricsHooks
};
