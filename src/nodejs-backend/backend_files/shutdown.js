
function setupShutdown(fastify) {
  const shutdown = async () => {
    fastify.log.info('SIGTERM/SIGINT received, closing server...');
    try {
      await fastify.close();
      fastify.log.info('Server closed');
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { setupShutdown };