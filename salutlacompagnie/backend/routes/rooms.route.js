async function roomsRoutes(fastify, opts) {
    const { createRoom, listRooms } = require("../roomStore.js");
    fastify.get("/api/rooms", async () => {
        return listRooms();
    });

    fastify.post("/api/rooms", async (req, reply) => {
        const { type, host } = req.body || {};
        if (!type) {
            return reply.status(400).send({ error: "Rooms.ROOM_TYPE_REQUIRED" });
        }
        if (!host) {
            return reply.status(400).send({ error: "Rooms.HOST_REQUIRED" });
        }
        const room = createRoom({type, host});
        return reply.status(201).send(room);
    });
}

module.exports = roomsRoutes;