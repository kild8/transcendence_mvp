const rooms = {}
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;


function createRoom({ type, host}) {
    const roomId = "room_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);

    const room = {
        id: roomId,
        type,
        maxPlayers: type === "1v1" ? 2 : 8,
        gameOver: false,
        participants: [],
        players: { player1: null, player2: null },
        tournament: type === "tournament"
            ?   {
                    host,
                    started: false,
                    inProgress: false,
                    players: [],
                    matches: [],
                    nextRound: [],
                    currentMatchIndex: 0,
                }
            : null,

        paddles: {
            player1: { position: { x: 20, y: CANVAS_HEIGHT / 2 - 50 }, width: 10, height: 100, speed: 6, score: 0 },
            player2: { position: { x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT / 2 - 50 }, width: 10, height: 100, speed: 6, score: 0 },   
        },

        ball: {
            position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
            velocity: { x: 6, y: 4 },
            size: 10,
        },

        tickId : null,
        lastInputs: { player1: null, player2: null },
        lastInputTimes: { player1: 0, player2: 0 },
    };

    rooms[roomId] = room;
    return room;
}

function listRooms() {
    return Object.values(rooms).map(r => ({
        id: r.id,
        type: r.type,
        players: r.participants.length,
        maxPlayers: r.maxPlayers
    }));
}

function getRoom(roomId) {
    return rooms[roomId];
}

function deleteRoom(roomId) {
    delete rooms[roomId];
}

module.exports = {
    rooms,
    createRoom,
    listRooms,
    getRoom,
    deleteRoom
};