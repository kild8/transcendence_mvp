
const {promClient} = require("../metrics.js");
const pinolog = require('../logger.js');

async function metricsRoutes(fastify, opts) {
    fastify.get('/metrics', async (req, reply) => {
    req.log.debug("Route Healthy");
    reply.header('Content-Type', promClient.register.contentType).send(await promClient.register.metrics());
    });
}

module.exports = {
    metricsRoutes
};