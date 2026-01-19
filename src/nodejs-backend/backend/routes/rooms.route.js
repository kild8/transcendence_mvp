async function roomsRoutes(fastify, opts) {
    const { createRoom, listRooms } = require("../roomStore.js");
    fastify.get("/api/rooms", async (req) => {
        req.log.debug("Route Healthy");
        return listRooms();
    });

    fastify.post("/api/rooms", async (req, reply) => {
        req.log.debug("Route Healthy");
        const { type } = req.body || {};
        if (!type) {
            return reply.status(400).send({ error: "room type required" });
        }
        const room = createRoom({ type });
        return reply.status(201).send(room);
    });
}

module.exports = roomsRoutes;