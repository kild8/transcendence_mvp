
const {promClient} = require("../metrics.js");

async function metricsRoutes(fastify, opts) {
    fastify.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', promClient.register.contentType).send(await promClient.register.metrics());
    });
}

module.exports = {
    metricsRoutes
};