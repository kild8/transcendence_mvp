const pinolog = require('./logger.js');

function setupShutdown(fastify) {
  const shutdown = async () => {
    pinolog.info('SIGTERM/SIGINT received, closing server...');
    try {
      await fastify.close();
      pinolog.info('Server closed');
      process.exit(0);
    } catch (err) {
      pinolog.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { setupShutdown };